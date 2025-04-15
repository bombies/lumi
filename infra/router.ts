import { webDNS } from './dns';

export const router: sst.aws.Router | undefined = $dev
	? undefined
	: new sst.aws.Router('LumiRouter', {
			domain: webDNS,
		});
