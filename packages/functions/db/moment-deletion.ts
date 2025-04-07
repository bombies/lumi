import { DatabaseMomentMessage, DatabaseRelationshipMomentTag } from '@lumi/core/moments/moment.types';
import { dynamo, getItems } from '@lumi/core/utils/dynamo/dynamo.service';
import { DynamoKey } from '@lumi/core/utils/dynamo/dynamo.types';
import { ContentPaths, StorageClient } from '@lumi/core/utils/s3/s3.service';
import { chunkArray } from '@lumi/core/utils/utils';
import { DynamoDBStreamEvent, Handler } from 'aws-lambda';
import { Resource } from 'sst';

export const handler: Handler<DynamoDBStreamEvent> = async event => {
	for (const record of event.Records) {
		if (!record.eventName || !record.dynamodb || !record.dynamodb.Keys) continue;

		// console.log(record.eventName, record.dynamodb?.Keys?.pk?.S, record.dynamodb?.Keys?.sk?.S);

		const partitionKey = record.dynamodb?.Keys?.pk?.S;
		const sortKey = record.dynamodb?.Keys?.sk?.S;

		if (!partitionKey || !sortKey) continue;

		const oldImage = record.dynamodb?.OldImage;
		if (!oldImage) continue;

		const momentId = oldImage.id.S!;
		console.log(`Moment with ID ${momentId} was deleted. Now performing cleanup...`);
		const relatedMessageRecords = await getItems<DatabaseMomentMessage>({
			table: Resource.Database.name,
			index: 'GSI1',
			queryExpression: {
				expression: '#gsi1pk = :gsi1pk',
				variables: {
					':gsi1pk': DynamoKey.momentMessage.gsi1pk(momentId),
				},
			},
			exhaustive: true,
		});

		const relatedTagRecords = await getItems<DatabaseRelationshipMomentTag>({
			table: Resource.Database.name,
			queryExpression: {
				expression: '#pk = :pk',
				variables: {
					':pk': DynamoKey.momentTag.pk(momentId),
				},
			},
			exhaustive: true,
		});

		// Batch delete related records
		console.log(
			`Deleting ${relatedMessageRecords.data.length} related message records and ${relatedTagRecords.data.length} tag records...`,
		);

		const aggregatedData = [...relatedMessageRecords.data, ...relatedTagRecords.data];
		if (aggregatedData.length)
			chunkArray(aggregatedData, 25).forEach(async (chunk, chunkIndex) => {
				console.log(`Deleting ${chunk.length} records... (Chunk ${chunkIndex + 1}/${chunkArray.length})`);
				await dynamo.batchWrite({
					RequestItems: {
						[Resource.Database.name]: chunk.map(record => ({
							DeleteRequest: {
								Key: {
									pk: record.pk,
									sk: record.sk,
								},
							},
						})),
					},
				});
				console.log(`Chunk successfully deleted! (Chunk ${chunkIndex + 1}/${chunkArray.length})`);
			});

		// Delete the video from S3.
		const storageClient = new StorageClient(Resource.ContentBucket.name);
		await storageClient.deleteObject(
			ContentPaths.relationshipMoments(oldImage.relationshipId.S!, oldImage.objectKey.S!),
		);

		if (oldImage.thumbnailObjectKey)
			await storageClient.deleteObject(
				ContentPaths.relationshipMoments(oldImage.relationshipId.S!, oldImage.thumbnailObjectKey.S!),
			);

		console.log('Deleted the video from S3!');
	}
};
