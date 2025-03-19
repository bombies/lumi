import cfSign from 'aws-cloudfront-sign';
import { SignatureOptions } from 'aws-cloudfront-sign/dist/cjs/types';
import { Resource } from 'sst';

type SignCdnUrlArgs = Omit<SignatureOptions, 'keypairId' | 'privateKeyString' | 'privateKeyPath' | 'expireTime'> & {
	/**
	* The time in milliseconds the signed URL should last for.
	@default 30 minutes.
	*/
	expiresIn?: number;
};

export const signCdnUrl = (url: string, args?: SignCdnUrlArgs) => {
	const { expiresIn, ...otherArgs } = args || {};
	const opts: SignatureOptions = {
		keypairId: Resource.ContentCdnKeyGroup.id,
		privateKeyString: process.env.CDN_PRIVATE_KEY,
		...otherArgs,
	};

	if (expiresIn) opts.expireTime = Date.now() + expiresIn;
	return cfSign.getSignedUrl(url, opts);
};
