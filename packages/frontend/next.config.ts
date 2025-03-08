import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	transpilePackages: ['@lumi/core', '@lumi/emails'],
	experimental: {
		turbo: {
			loaders: {}
		}
	}
};

export default nextConfig;
