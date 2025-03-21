import { trpc } from './api';
import { apiDNS, webDNS } from './dns';
import { frontend } from './frontend';

const routerDeployedStages = ['staging'];

export const router: sst.aws.Router | undefined = $dev
	? undefined
	: $app.stage === 'production'
		? new sst.aws.Router('LumiProdRouter', {
				domain: 'lumi.ajani.me',
			})
		: routerDeployedStages.includes($app.stage)
			? new sst.aws.Router('LumiRouter', {
					domain: '*.lumi.ajani.me',
				})
			: sst.aws.Router.get('LumiRouter', 'E2G6RPQXMYTFV3');

router?.routeSite($app.stage === 'production' ? '/' : webDNS + '/', frontend);
router?.route(apiDNS + '/', trpc.url);
