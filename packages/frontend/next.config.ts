import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	transpilePackages: ['@lumi/core', '@lumi/emails'],
};

export default nextConfig;
