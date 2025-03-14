import { SQS } from '@aws-sdk/client-sqs';
import { ScanCommandInput, ScanCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DatabaseAffirmation } from '@lumi/core/types/affirmations.types';
import { KeyPrefix } from '@lumi/core/types/dynamo.types';
import { dynamo } from '@lumi/core/utils/dynamo/dynamo.service';
import { Handler } from 'aws-lambda';
import { Resource } from 'sst';

const queue = new SQS();

export const handler: Handler = async () => {
	const relationshipIds = new Set<string>();

	let params: ScanCommandInput = {
		TableName: process.env.TABLE_NAME,
		FilterExpression: 'begins_with(#pk, :pk)',
		ExpressionAttributeNames: {
			'#pk': 'pk',
		},
		ExpressionAttributeValues: {
			':pk': KeyPrefix.AFFIRMATION,
		},
	};

	let res: ScanCommandOutput | undefined;
	do {
		let res = await dynamo.scan(params);
		params.ExclusiveStartKey = res.LastEvaluatedKey;
		if (res.$metadata.httpStatusCode !== 200) throw new Error('Failed to scan relationships');

		for (const item of res.Items as DatabaseAffirmation[]) relationshipIds.add(item.relationshipId);
	} while (res?.LastEvaluatedKey);

	console.log(`Queueing affirmation notifications for ${relationshipIds.size} relationships...`);
	for (const relationship of relationshipIds) {
		await queue.sendMessage({
			QueueUrl: Resource.AffirmationSenderQueue.url,
			MessageBody: JSON.stringify(relationship),
		});
	}
	console.log('All done!');
};
