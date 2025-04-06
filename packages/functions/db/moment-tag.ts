import { createRelationshipMomentTag, getRelationshipMomentTag } from '@lumi/core/moments/moment.service';
import { RelationshipMomentTag } from '@lumi/core/types/moment.types';
import { updateItem } from '@lumi/core/utils/dynamo/dynamo.service';
import { DynamoKey } from '@lumi/core/utils/dynamo/dynamo.types';
import { DynamoDBStreamEvent, Handler } from 'aws-lambda';

const updateRelationshipMomentTag = async (relationshipId: string, tag: string, countDelta: number) => {
	let relationshipMomentTag = await getRelationshipMomentTag(relationshipId, tag);
	if (!relationshipMomentTag)
		return console.log(`Relationship tag ${relationshipId}#${tag} doesn't exist, skipping update.`);

	try {
		console.log(`Updating relationship moment tag for ${relationshipId}#${tag}`);
		await updateItem<RelationshipMomentTag>({
			pk: DynamoKey.relationshipMomentTag.pk(relationshipId),
			sk: DynamoKey.relationshipMomentTag.sk(tag),
			update: {
				associationCount: relationshipMomentTag.associationCount + countDelta,
			},
		});
		console.log('Successfully updated the relationship moment tag!');
	} catch (e) {
		console.error('Something went wrong updating the relationship moment tag!', e);
	}
};

export const handler: Handler<DynamoDBStreamEvent> = async event => {
	for (const record of event.Records) {
		if (!record.eventName || !record.dynamodb || !record.dynamodb.Keys) continue;

		const partitionKey = record.dynamodb?.Keys?.pk?.S;
		const sortKey = record.dynamodb?.Keys?.sk?.S;

		if (!partitionKey || !sortKey) continue;

		try {
			switch (record.eventName) {
				case 'REMOVE':
					const oldImage = record.dynamodb.OldImage;
					if (!oldImage) {
						console.error('Old image is missing for REMOVE event');
						continue;
					}

					await updateRelationshipMomentTag(oldImage.relationshipId.S!, oldImage.tag.S!, -1);
					break;
				case 'INSERT':
					const newImage = record.dynamodb.NewImage;
					if (!newImage) {
						console.error('New image is missing for INSERT event');
						continue;
					}

					await updateRelationshipMomentTag(newImage.relationshipId.S!, newImage.tag.S!, 1);
					break;
			}
		} catch (e) {
			console.error('There was an unexpected error handling a DynamoDB stream record!', e);
		}
	}
};
