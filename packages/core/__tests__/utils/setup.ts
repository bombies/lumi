import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { cleanupDatabase } from './db-cleanup';
import { startDynamoDBLocal, stopDynamoDBLocal } from './dynamodb-local';
import { setupMocks } from './mocks';

// Mock environment variables
process.env.TABLE_NAME = 'lumi-test-table';
process.env.AWS_REGION = 'us-east-1';
process.env.NOTIFICATIONS_TOPIC = 'lumi/test/notifications';
process.env.AUTH_SECRET = 'test-auth-secret';
process.env.FRONTEND_URL = 'https://test.lumi.ajani.me';
process.env.APP_STAGE = 'test';
process.env.CDN_URL = 'https://test-cdn.lumi.ajani.me';
process.env.CDN_PRIVATE_KEY = 'test-cdn-private-key';
process.env.KEY_PAIR_ID = 'test-key-pair-id';

// Mock AWS SDK
vi.mock('@aws-sdk/client-dynamodb', async () => {
	const actual = await vi.importActual('@aws-sdk/client-dynamodb');
	return {
		...actual,
		DynamoDBClient: vi.fn().mockImplementation(() => ({
			send: vi.fn(),
		})),
	};
});

// Setup before all tests
beforeAll(async () => {
	console.log('Starting new test suite...');
	await startDynamoDBLocal();
	setupMocks();
});

// Setup before each test
beforeEach(async () => {
	// Reset mocks between tests
	vi.clearAllMocks();
});

// Cleanup after each test
afterEach(async () => {
	await cleanupDatabase();
});

// Cleanup after all tests
afterAll(async () => {
	await stopDynamoDBLocal();
});
