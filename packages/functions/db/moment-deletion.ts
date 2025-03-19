import { QueryCommandOutput } from '@aws-sdk/lib-dynamodb';
import { KeyPrefix } from '@lumi/core/types/dynamo.types';
import { MomentMessage } from '@lumi/core/types/moment.types';
import { dynamo } from '@lumi/core/utils/dynamo/dynamo.service';
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

		let res: QueryCommandOutput | undefined;
		const relatedRecords: MomentMessage[] = [];
		do {
			res = await dynamo.query({
				TableName: Resource.Database.name,
				IndexName: 'GSI1',
				KeyConditionExpression: '#pk = :pk',
				ExpressionAttributeNames: {
					'#pk': 'gsi1pk',
				},
				ExpressionAttributeValues: {
					':pk': `${KeyPrefix.MOMENT_MESSAGE}${oldImage.momentId.S!}`,
				},
				ExclusiveStartKey: res?.LastEvaluatedKey,
			});

			if (res.Items) relatedRecords.push(...res.Items.map(item => item as MomentMessage));
		} while (res.LastEvaluatedKey);

		// Batch delete related records
		console.log(`Deleting ${relatedRecords.length} related records...`);
		if (relatedRecords.length)
			chunkArray(relatedRecords, 25).forEach(async (chunk, chunkIndex) => {
				console.log(`Deleting ${chunk.length} records... (Chunk ${chunkIndex + 1}/${chunkArray.length})`);
				await dynamo.batchWrite({
					RequestItems: {
						[Resource.Database.name]: chunk.map(record => ({
							DeleteRequest: {
								Key: {
									pk: `${KeyPrefix.MOMENT_MESSAGE}${record.id}`,
									sk: `${KeyPrefix.MOMENT_MESSAGE}${record.id}`,
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
		console.log('Deleted the video from S3!');
	}
};
