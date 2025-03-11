import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'Lumi',
		short_name: 'Lumi',
		description: 'A space for you and your partner.',
		start_url: '/',
		display: 'standalone',
		background_color: '#F8FFF1',
		theme_color: '#76A34E',
		icons: [
			{
				src: '/web-app-manifest-192x192.png',
				sizes: '192x192',
				type: 'image/png',
				purpose: 'maskable',
			},
			{
				src: '/web-app-manifest-512x512.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'maskable',
			},
		],
	};
}
