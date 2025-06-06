/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
	app(input) {
		return {
			name: 'lumi',
			removal: input?.stage === 'production' ? 'retain' : 'remove',
			protect: ['production'].includes(input?.stage),
			home: 'aws',
			providers: { std: '2.2.0' },
		};
	},
	async run() {
		const infra = await import('./infra');
		return {
			AwsAccountID: infra.accountId,
			Website: infra.frontend.url,
			Api: infra.trpc.url,
			ContentCdn: $interpolate`${infra.contentCdn.domainUrl.apply(domainUrl => domainUrl ?? infra.contentCdn.url)}`,
			Database: infra.db.arn,
			RealtimeEndpoint: infra.realtimeServer.endpoint,
			RealtimeAuthorizer: infra.realtimeServer.authorizer,
		};
	},
});
