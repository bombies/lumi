import { QueryCommandOutput } from '@aws-sdk/lib-dynamodb';
import { MomentMessage } from '@lumi/core/types/moment.types';
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

		const relatedRecords = await getItems<MomentMessage>({
			table: Resource.Database.name,
			index: 'GSI1',
			queryExpression: {
				expression: '#gsi1pk = :gsi1pk',
				variables: {
					':gsi1pk': DynamoKey.moment.gsi1pk(oldImage.id.S!),
				},
			},
			exhaustive: true,
		});

		// Batch delete related records
		console.log(`Deleting ${relatedRecords.data.length} related records...`);
		if (relatedRecords.data.length)
			chunkArray(relatedRecords.data, 25).forEach(async (chunk, chunkIndex) => {
				console.log(`Deleting ${chunk.length} records... (Chunk ${chunkIndex + 1}/${chunkArray.length})`);
				await dynamo.batchWrite({
					RequestItems: {
						[Resource.Database.name]: chunk.map(record => ({
							DeleteRequest: {
								Key: {
									pk: DynamoKey.moment.pk(record.id),
									sk: DynamoKey.moment.sk(record.id),
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

		if (oldImage.thumbnailObjectKey.S)
			await storageClient.deleteObject(
				ContentPaths.relationshipMoments(oldImage.relationshipId.S!, oldImage.thumbnailObjectKey.S),
			);

		console.log('Deleted the video from S3!');
	}
};
