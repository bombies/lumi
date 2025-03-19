import { deleteAffirmationsForRelationship } from '@lumi/core/affirmations/affirmations.service';
import { deleteMomentDetailsForRelationship } from '@lumi/core/moments/moment.service';
import { Relationship } from '@lumi/core/types/relationship.types';
import { DynamoDBStreamEvent, Handler } from 'aws-lambda';

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

					await deleteAffirmationsForRelationship(oldImage.id.S!);
					await deleteMomentDetailsForRelationship(oldImage.id.S!);
					break;
			}
		} catch (e) {
			console.error('There was an unexpected error handling a DynamoDB stream record!', e);
		}
	}
};
