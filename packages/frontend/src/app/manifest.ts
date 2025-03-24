import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'Lumi',
		short_name: 'Lumi',
		description: 'A space for you and your partner.',
		categories: ['photo', 'music', 'lifestyle', 'social'],
		start_url: '/home',
		scope: '/',
		display: 'standalone',
		background_color: '#F8FFF1',
		theme_color: '#f8fff1',
		icons: [
			{
				src: '/web-app-manifest-192x192.png',
				sizes: '192x192',
				type: 'image/png',
			},
			{
				src: '/web-app-manifest-512x512.png',
				sizes: '512x512',
				type: 'image/png',
			},
		],
		screenshots: [
			{
				src: '/web-app-manifest-512x512.png',
				form_factor: 'wide',
				sizes: '512x512',
				type: 'image/png',
			},
			{
				src: '/web-app-manifest-512x512.png',
				sizes: '512x512',
				type: 'image/png',
			},
		],
	};
}
