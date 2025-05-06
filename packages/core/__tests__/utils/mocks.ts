import { vi } from 'vitest';

export const setupMocks = () => {
	// Mock S3 client
	vi.mock('@aws-sdk/client-s3', () => {
		return {
			S3Client: vi.fn().mockImplementation(() => ({
				send: vi.fn().mockResolvedValue({}),
			})),
			PutObjectCommand: vi.fn(),
			GetObjectCommand: vi.fn(),
			DeleteObjectCommand: vi.fn(),
			DeleteObjectsCommand: vi.fn(),
		};
	});

	// Mock S3 presigner
	vi.mock('@aws-sdk/s3-request-presigner', () => {
		return {
			getSignedUrl: vi.fn().mockResolvedValue('https://test-signed-url.com'),
		};
	});

	// Mock Redis
	vi.mock('ioredis', () => {
		const mockRedis = {
			get: vi.fn().mockResolvedValue(null),
			set: vi.fn().mockResolvedValue('OK'),
			setex: vi.fn().mockResolvedValue('OK'),
			del: vi.fn().mockResolvedValue(1),
			connect: vi.fn().mockResolvedValue(undefined),
			disconnect: vi.fn().mockResolvedValue(undefined),
		};
		return {
			default: vi.fn(() => mockRedis),
		};
	});

	// Mock MQTT
	vi.mock('mqtt', () => {
		const mockClient = {
			publish: vi.fn().mockImplementation((topic, message, callback) => {
				if (callback) callback(null);
				return true;
			}),
			publishAsync: vi.fn().mockResolvedValue({}),
			subscribe: vi.fn().mockImplementation((topic, options, callback) => {
				if (callback) callback(null);
				return true;
			}),
			subscribeAsync: vi.fn().mockResolvedValue({}),
			end: vi.fn().mockReturnValue(true),
			on: vi.fn(),
		};
		return {
			connect: vi.fn().mockReturnValue(mockClient),
			connectAsync: vi.fn().mockResolvedValue(mockClient),
		};
	});

	// Mock web-push
	vi.mock('web-push', () => {
		return {
			default: {
				setVapidDetails: vi.fn(),
				sendNotification: vi.fn().mockResolvedValue({ statusCode: 201 }),
			},
			setVapidDetails: vi.fn(),
			sendNotification: vi.fn().mockResolvedValue({ statusCode: 201 }),
		};
	});

	// Mock nodemailer
	vi.mock('nodemailer', () => {
		const mockTransporter = {
			sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
		};
		return {
			default: {
				createTransport: vi.fn().mockReturnValue(mockTransporter),
			},
			createTransport: vi.fn().mockReturnValue(mockTransporter),
		};
	});

	// Mock SST Resource
	vi.mock('sst', () => {
		return {
			Resource: {
				ContentBucket: { name: 'test-content-bucket' },
				Database: { name: 'test-database' },
				RealtimeServer: {
					endpoint: 'test-realtime-endpoint',
					authorizer: 'test-realtime-authorizer',
				},
				VapidPublicKey: { value: 'test-vapid-public-key' },
				VapidPrivateKey: { value: 'test-vapid-private-key' },
				MailerHost: { value: 'test-mailer-host' },
				MailerPort: { value: '587' },
				MailerUser: { value: 'test-mailer-user' },
				MailerPassword: { value: 'test-mailer-password' },
				RedisHost: { value: 'test-redis-host' },
				RedisPort: { value: '6379' },
				RedisUser: { value: 'test-redis-user' },
				RedisPassword: { value: 'test-redis-password' },
				AffirmationSenderQueue: { url: 'test-affirmation-sender-queue-url' },
			},
		};
	});

	// Mock cloudfront-sign
	vi.mock('aws-cloudfront-sign', () => {
		return {
			default: {
				getSignedUrl: vi.fn().mockReturnValue('https://test-signed-cdn-url.com'),
			},
			getSignedUrl: vi.fn().mockReturnValue('https://test-signed-cdn-url.com'),
		};
	});

	// Mock jose for JWT operations
	vi.mock('jose', () => {
		return {
			createRemoteJWKSet: vi.fn().mockReturnValue(() => Promise.resolve({ keys: [] })),
			jwtVerify: vi.fn().mockImplementation((token) => {
				if (token === 'valid-token') {
					return Promise.resolve({
						payload: { id: 'test-user-id', email: 'test@example.com' },
					});
				}
				if (token === 'expired-token') {
					throw new Error('JWTExpired');
				}
				throw new Error('JWSInvalid');
			}),
			SignJWT: vi.fn().mockImplementation(() => ({
				setProtectedHeader: () => ({
					setExpirationTime: () => ({
						setIssuedAt: () => ({
							setNotBefore: () => ({
								sign: () => Promise.resolve('test-token'),
							}),
						}),
					}),
				}),
			})),
			JWTExpired: Error,
			JWSInvalid: Error,
		};
	});

	// Mock AWS SQS
	vi.mock('@aws-sdk/client-sqs', () => {
		return {
			SQS: vi.fn().mockImplementation(() => ({
				sendMessage: vi.fn().mockResolvedValue({}),
			})),
		};
	});
};
