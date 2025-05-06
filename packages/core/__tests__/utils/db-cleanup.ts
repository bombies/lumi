import { DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from './dynamodb-local';

export const cleanupDatabase = async (): Promise<void> => {
	try {
		// Scan all items in the table
		const scanResult = await dynamoClient.send(new ScanCommand({
			TableName: process.env.TABLE_NAME,
		}));

		// Delete all items
		if (scanResult.Items && scanResult.Items.length > 0) {
			const deletePromises = scanResult.Items.map(item =>
				dynamoClient.send(new DeleteCommand({
					TableName: process.env.TABLE_NAME,
					Key: {
						pk: item.pk,
						sk: item.sk,
					},
				})),
			);

			await Promise.all(deletePromises);
			console.log(`Cleaned up ${scanResult.Items.length} items from the database`);
		}
	} catch (error) {
		console.error('Error cleaning up database:', error);
	}
};
