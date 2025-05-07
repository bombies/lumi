import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import { CreateTableCommand, DeleteTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';

let dynamoProcess: ChildProcess | null = null;
// eslint-disable-next-line import/no-mutable-exports
let dynamoClient: DynamoDBClient;

export const startDynamoDBLocal = async (): Promise<void> => {
	console.log('Starting local DynamoDB...');
	return new Promise((resolve, reject) => {
		// Start DynamoDB Local as a child process
		dynamoProcess = spawn('java', [
			'-Djava.library.path=./DynamoDBLocal_lib',
			'-jar',
			'DynamoDBLocal.jar',
			'-inMemory',
			'-port',
			'8000',
		], {
			cwd: './node_modules/dynamodb-local/dist',
			stdio: 'pipe',
		});

		dynamoProcess.stdout?.on('data', (data) => {
			console.log(`DynamoDB Local: ${data}`);
			if (data.toString().includes('CorsParams')) {
				// DynamoDB is ready when it logs about CorsParams
				console.log('DynamoDB is ready! Setting up the instance...');
				setupDynamoClient();
				createTestTable()
					.then(resolve)
					.catch(reject);
			}
		});

		dynamoProcess.stderr?.on('data', (data) => {
			console.error(`DynamoDB Local Error: ${data}`);
		});

		dynamoProcess.on('error', (error) => {
			console.error('Failed to start DynamoDB Local:', error);
			reject(error);
		});

		// Timeout if DynamoDB doesn't start in 10 seconds
		// setTimeout(() => {
		// 	if (dynamoClient === undefined) {
		// 		reject(new Error('DynamoDB Local failed to start within timeout'));
		// 	}
		// }, 10000);
	});
};

export const stopDynamoDBLocal = async (): Promise<void> => {
	if (dynamoProcess) {
		dynamoProcess.kill();
		dynamoProcess = null;
		console.log('DynamoDB Local stopped');
	}
};

const setupDynamoClient = async () => {
	// console.log('Setting up the DynamoDB client...');
	// dynamoClient = new DynamoDBClient({
	// 	region: 'us-east-1',
	// 	endpoint: 'http://localhost:8000',
	// 	credentials: {
	// 		accessKeyId: 'test',
	// 		secretAccessKey: 'test',
	// 	},
	// });

	// // Override the dynamo client in the service
	// const dynamoService = await import('../../src/utils/dynamo/dynamo.service');
	// dynamoService.client = dynamoClient;
	// console.log('Finished setting up the DynamoDB client!');
};

const createTestTable = async () => {
	try {
		const client = new DynamoDBClient({
			region: 'us-east-1',
			endpoint: 'http://localhost:8000',
			credentials: {
				accessKeyId: 'test',
				secretAccessKey: 'test',
			},
		});

		await client.send(new CreateTableCommand({
			TableName: process.env.TABLE_NAME,
			AttributeDefinitions: [
				{ AttributeName: 'pk', AttributeType: 'S' },
				{ AttributeName: 'sk', AttributeType: 'S' },
				{ AttributeName: 'gsi1pk', AttributeType: 'S' },
				{ AttributeName: 'gsi1sk', AttributeType: 'S' },
				{ AttributeName: 'gsi2pk', AttributeType: 'S' },
				{ AttributeName: 'gsi2sk', AttributeType: 'S' },
				{ AttributeName: 'gsi3pk', AttributeType: 'S' },
				{ AttributeName: 'gsi3sk', AttributeType: 'S' },
				{ AttributeName: 'gsi4pk', AttributeType: 'S' },
				{ AttributeName: 'gsi4sk', AttributeType: 'S' },
			],
			KeySchema: [
				{ AttributeName: 'pk', KeyType: 'HASH' },
				{ AttributeName: 'sk', KeyType: 'RANGE' },
			],
			GlobalSecondaryIndexes: [
				{
					IndexName: 'GSI1',
					KeySchema: [
						{ AttributeName: 'gsi1pk', KeyType: 'HASH' },
						{ AttributeName: 'gsi1sk', KeyType: 'RANGE' },
					],
					Projection: { ProjectionType: 'ALL' },
					ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
				},
				{
					IndexName: 'GSI2',
					KeySchema: [
						{ AttributeName: 'gsi2pk', KeyType: 'HASH' },
						{ AttributeName: 'gsi2sk', KeyType: 'RANGE' },
					],
					Projection: { ProjectionType: 'ALL' },
					ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
				},
				{
					IndexName: 'GSI3',
					KeySchema: [
						{ AttributeName: 'gsi3pk', KeyType: 'HASH' },
						{ AttributeName: 'gsi3sk', KeyType: 'RANGE' },
					],
					Projection: { ProjectionType: 'ALL' },
					ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
				},
				{
					IndexName: 'GSI4',
					KeySchema: [
						{ AttributeName: 'gsi4pk', KeyType: 'HASH' },
						{ AttributeName: 'gsi4sk', KeyType: 'RANGE' },
					],
					Projection: { ProjectionType: 'ALL' },
					ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
				},
			],
			ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
		}));

		console.log(`Created test table: ${process.env.TABLE_NAME}`);
	} catch (error) {
		console.error('Error creating test table:', error);
		throw error;
	}
};

export const deleteTestTable = async () => {
	try {
		const client = new DynamoDBClient({
			region: 'us-east-1',
			endpoint: 'http://localhost:8000',
			credentials: {
				accessKeyId: 'test',
				secretAccessKey: 'test',
			},
		});

		await client.send(new DeleteTableCommand({
			TableName: process.env.TABLE_NAME,
		}));

		console.log(`Deleted test table: ${process.env.TABLE_NAME}`);
	} catch (error) {
		console.error('Error deleting test table:', error);
	}
};

export { dynamoClient };
