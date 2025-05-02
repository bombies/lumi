/* eslint-disable no-restricted-globals */
self.addEventListener('push', (event) => {
	if (event.data) {
		const data = event.data.json();
		console.log('Received push data', data);
		const { openUrl, body } = data;
		const options = {
			body,
			icon: data.icon || 'favicon-96x96.png',
			badge: 'favicon-96x96.png',
			vibrate: [100, 50, 100],
			data: {
				openUrl,
				dateOfArrival: Date.now(),
			},
		};
		event.waitUntil(self.registration.showNotification(data.title, options));
	}
});

self.addEventListener('notificationclick', (event) => {
	console.debug('Notification click received.');
	event.notification.close();

	const { openUrl } = event.notification.data;
	event.waitUntil(
		// eslint-disable-next-line no-undef
		clients.openWindow(
			`${process.env.NODE_ENV === 'development' ? 'https://localhost:3000' : process.env.NEXT_PUBLIC_CANONICAL_URL}${openUrl || ''}`,
		),
	);
});
