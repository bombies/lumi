import type { OpenNextConfig } from '@opennextjs/aws/types/open-next';

const config = {
	default: {},
	warmer: {
		invokeFunction: 'aws-lambda',
	},
} satisfies OpenNextConfig;

export default config;
