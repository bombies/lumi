import type { NextConfig } from 'next';
import { RemotePattern } from 'next/dist/shared/lib/image-config';
import { withNextVideo } from 'next-video/process';

const remotePatterns: RemotePattern[] = [
	{
		protocol: 'https',
		hostname: 'i.scdn.co',
	},
];
if (process.env.CDN_URL) {
	remotePatterns.push({
		protocol: 'https',
		hostname: process.env.CDN_URL.replace('https://', ''),
	});
}

const nextConfig: NextConfig = {
	images: {
		remotePatterns: remotePatterns,
	},
	transpilePackages: ['@lumi/core', '@lumi/emails'],
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					{
						key: 'X-Content-Type-Options',
						value: 'nosniff',
					},
					{
						key: 'X-Frame-Options',
						value: 'DENY',
					},
					{
						key: 'Referrer-Policy',
						value: 'strict-origin-when-cross-origin',
					},
				],
			},
			{
				source: '/notification-worker.js',
				headers: [
					{
						key: 'Content-Type',
						value: 'application/javascript; charset=utf-8',
					},
					{
						key: 'Cache-Control',
						value: 'no-cache, no-store, must-revalidate',
					},
					{
						key: 'Content-Security-Policy',
						value: "default-src 'self'; script-src 'self'",
					},
				],
			},
		];
	},
};

export default withNextVideo(nextConfig, {
	provider: 'amazon-s3',
	providerConfig: {
		'amazon-s3': {
			endpoint: 'https://' + process.env.CONTENT_BUCKET_ENDPOINT!,
			bucket: process.env.CONTENT_BUCKET_NAME!,
			accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
		},
	},
});
