import type { DynamoDBStreamEvent, Handler } from 'aws-lambda';
import { getMomentTagsForRelationshipTag } from '@lumi/core/moments/moment.service';
import { deleteManyItems } from '@lumi/core/utils/dynamo/dynamo.service';

export const handler: Handler<DynamoDBStreamEvent> = async (event) => {
	for (const record of event.Records) {
		if (!record.eventName || !record.dynamodb || !record.dynamodb.Keys) continue;

		const partitionKey = record.dynamodb?.Keys?.pk?.S;
		const sortKey = record.dynamodb?.Keys?.sk?.S;

		if (!partitionKey || !sortKey) continue;

		const oldImage = record.dynamodb?.OldImage;
		if (!oldImage) continue;

		const [relationshipId, tag] = [oldImage.relationshipId.S!, oldImage.tag.S!];
		console.log(`Deleting related tags for relationship moment tag ${relationshipId}#${tag}`);
		const momentTags = await getMomentTagsForRelationshipTag(relationshipId, tag);

		if (momentTags.data.length === 0) return console.log('No related tags found.');

		console.log(`Found ${momentTags.data.length} related tags. Deleting them all...`);
		await deleteManyItems(momentTags.data.map(momentTag => ({ pk: momentTag.pk, sk: momentTag.sk })));
		console.log('Deleted all related tag.');
	}
};
