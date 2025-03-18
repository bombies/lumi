import { QueryCommandOutput } from '@aws-sdk/lib-dynamodb';
import { deleteStoredRefreshToken } from '@lumi/core/auth/auth.service';
import { RefreshToken } from '@lumi/core/types/auth.types';
import { KeyPrefix } from '@lumi/core/types/dynamo.types';
import { dynamo } from '@lumi/core/utils/dynamo/dynamo.service';
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

		// Get any records where the replacedBy attribute is the id of the deleted record.
		let res: QueryCommandOutput | undefined;
		const relatedRecords: RefreshToken[] = [];
		do {
			res = await dynamo.query({
				TableName: Resource.Database.name,
				KeyConditionExpression: '#pk = :pk',
				FilterExpression: '#replacedBy = :replacedBy',
				ExpressionAttributeNames: {
					'#pk': 'pk',
					'#replacedBy': 'replacedBy',
				},
				ExpressionAttributeValues: {
					':pk': `${KeyPrefix.REFRESH_TOKEN}${oldImage.userId.S!}`,
					':replacedBy': oldImage.id.S!,
				},
				ExclusiveStartKey: res?.LastEvaluatedKey,
			});

			if (res.Items) relatedRecords.push(...res.Items.map(item => item as RefreshToken));
		} while (res.LastEvaluatedKey);

		// Batch delete related records
		if (relatedRecords.length)
			await dynamo.batchWrite({
				RequestItems: {
					[Resource.Database.name]: relatedRecords.map(record => ({
						DeleteRequest: {
							Key: {
								pk: `${KeyPrefix.REFRESH_TOKEN}${record.userId}`,
								sk: record.id,
							},
						},
					})),
				},
			});
	}
};
