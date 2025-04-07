import { Lambda } from '@aws-sdk/client-lambda';
import { APIGatewayProxyEvent, Handler } from 'aws-lambda';
import { Resource } from 'sst';

const lambda = new Lambda({
	region: 'us-east-1',
});

export const handler: Handler<APIGatewayProxyEvent> = async () => {
	const functions = [
		{
			name: 'Frontend',
			functionName: process.env.FRONTEND_FUNCTION_NAME!,
		},
		{
			name: 'API',
			functionName: process.env.API_FUNCTION_NAME!,
		},
	];

	for (const { name, functionName } of functions) {
		if (!functionName.length) {
			console.error(`Function name is empty for ${name}`);
			continue;
		}

		console.log(`Warming up ${name} Lambda... (${functionName})`);
		try {
			await lambda.invoke({
				FunctionName: functionName,
				InvocationType: 'Event',
				Payload: JSON.stringify({
					body: null,
					headers: { 'user-agent': 'Lambda Warmer' },
					multiValueHeaders: { 'user-agent': ['Lambda Warmer'] },
					httpMethod: 'GET',
					isBase64Encoded: false,
					path: '/warmup',
					pathParameters: null,
					queryStringParameters: null,
					multiValueQueryStringParameters: null,
					stageVariables: null,
					requestContext: {
						accountId: '123456789012',
						apiId: 'api-id',
						authorizer: null,
						protocol: 'HTTP/1.1',
						httpMethod: 'GET',
						domainName: 'example.com',
						identity: {
							accessKey: null,
							accountId: null,
							apiKey: null,
							apiKeyId: null,
							caller: null,
							clientCert: null,
							cognitoAuthenticationProvider: null,
							cognitoAuthenticationType: null,
							cognitoIdentityId: null,
							cognitoIdentityPoolId: null,
							principalOrgId: null,
							sourceIp: '127.0.0.1',
							user: null,
							userAgent: 'Lambda Warmer',
							userArn: null,
						},
						path: '/warmup',
						stage: 'dev',
						requestId: `warmer-${Date.now()}`,
						requestTimeEpoch: Date.now(),
						resourceId: 'resource-id',
						resourcePath: '/warmup',
					},
					resource: '/warmup',
				} satisfies APIGatewayProxyEvent),
			});
			console.log(`Warmed up ${name} Lambda!`);
		} catch (e) {
			console.error(`Error warming up ${name} Lambda:`, e);
		}
	}
};
