self.addEventListener('push', function (event) {
	if (event.data) {
		const data = event.data.json();
		const options = {
			body: data.body,
			icon: data.icon || 'favicon-96x96.png',
			badge: 'favicon-96x96.png',
			vibrate: [100, 50, 100],
			data: {
				dateOfArrival: Date.now(),
			},
		};
		event.waitUntil(self.registration.showNotification(data.title, options));
	}
});

self.addEventListener('notificationclick', function (event) {
	console.debug('Notification click received.');
	event.notification.close();
	event.waitUntil(
		clients.openWindow(
			process.env.NODE_ENV === 'development' ? 'https://localhost:3000' : process.env.NEXT_PUBLIC_CANONICAL_URL,
		),
	);
});
