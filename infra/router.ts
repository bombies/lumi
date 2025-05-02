import { webDNS } from './dns';

export const router: sst.aws.Router | undefined = $dev ? undefined : new sst.aws.Router('LumiRouter', {
			domain: {
				name: webDNS,
				aliases: [`*.${webDNS}`]
			}
		});
