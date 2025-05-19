import type { NextConfig } from 'next';
import type { RemotePattern } from 'next/dist/shared/lib/image-config';
import { withSentryConfig } from '@sentry/nextjs';
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
		remotePatterns,
	},
	poweredByHeader: false,
	reactStrictMode: true,
	eslint: {
		dirs: ['.'],
	},
	transpilePackages: ['@lumi/core', '@lumi/emails'],
	// experimental: {
	// 	reactCompiler: true,
	// },
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
						value: 'default-src \'self\'; script-src \'self\'',
					},
				],
			},
		];
	},
};

export default withSentryConfig(
	withNextVideo(nextConfig, {
		provider: 'amazon-s3',
		providerConfig: {
			'amazon-s3': {
				endpoint: `https://${process.env.CONTENT_BUCKET_ENDPOINT!}`,
				bucket: process.env.CONTENT_BUCKET_NAME!,
				accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
			},
		},
	}),
	{
		// For all available options, see:
		// https://www.npmjs.com/package/@sentry/webpack-plugin#options

		org: 'lumi-sg',
		project: 'lumi-frontend-dev',

		// Only print logs for uploading source maps in CI
		silent: !process.env.CI,

		// For all available options, see:
		// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

		// Upload a larger set of source maps for prettier stack traces (increases build time)
		widenClientFileUpload: true,

		// Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
		// This can increase your server load as well as your hosting bill.
		// Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
		// side errors will fail.
		tunnelRoute: '/monitoring',

		// Automatically tree-shake Sentry logger statements to reduce bundle size
		disableLogger: true,

		// Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
		// See the following for more information:
		// https://docs.sentry.io/product/crons/
		// https://vercel.com/docs/cron-jobs
		automaticVercelMonitors: true,
	},
);
