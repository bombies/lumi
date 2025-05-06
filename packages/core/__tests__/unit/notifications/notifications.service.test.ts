import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	addUnreadNotificationToCount,
	createNotificationSubscription,
	deleteNotificationSubscription,
	getFilteredStoredNotifications,
	getNotificationSubscription,
	getNotificationSubscriptions,
	getStoredNotifications,
	getUnreadNotificationCount,
	markAllNotificationsAsRead,
	markBulkNotificationsAsRead,
	removeUnreadNotificationFromCount,
	sendNotification,
	storeNotification,
	updateNotification,
	updateUnreadNotificationCount,
} from '../../../src/notifications/notifications.service';
import { createUser } from '../../../src/users/users.service';

describe('notifications Service', () => {
	let user: any;

	beforeEach(async () => {
		// Create test user
		user = await createUser({
			email: 'notifuser@example.com',
			username: 'notifuser',
			firstName: 'Notif',
			lastName: 'User',
		});
	});

	describe('createNotificationSubscription', () => {
		it('should create a notification subscription', async () => {
			const subscription = {
				endpoint: 'https://example.com/push/123',
				expirationTime: null,
				keys: {
					auth: 'auth-key',
					p256dh: 'p256dh-key',
				},
			};

			const result = await createNotificationSubscription(user.id, subscription);

			expect(result).toBeDefined();
			expect(result.subscriberId).toBe(user.id);
			expect(result.endpoint).toBe(subscription.endpoint);
			expect(result.keys).toEqual(subscription.keys);
		});
	});

	describe('getNotificationSubscription', () => {
		it('should return a notification subscription by endpoint', async () => {
			const subscription = {
				endpoint: 'https://example.com/push/456',
				expirationTime: null,
				keys: {
					auth: 'auth-key-2',
					p256dh: 'p256dh-key-2',
				},
			};

			await createNotificationSubscription(user.id, subscription);
			const retrievedSubscription = await getNotificationSubscription(user.id, subscription.endpoint);

			expect(retrievedSubscription).toBeDefined();
			expect(retrievedSubscription?.subscriberId).toBe(user.id);
			expect(retrievedSubscription?.endpoint).toBe(subscription.endpoint);
		});

		it('should return null for non-existent subscription', async () => {
			const nonExistentEndpoint = 'https://example.com/push/non-existent';
			const subscription = await getNotificationSubscription(user.id, nonExistentEndpoint);
			expect(subscription).toBeNull();
		});
	});

	describe('getNotificationSubscriptions', () => {
		it('should return all subscriptions for a user', async () => {
			// Create multiple subscriptions
			await createNotificationSubscription(user.id, {
				endpoint: 'https://example.com/push/sub1',
				expirationTime: null,
				keys: { auth: 'auth1', p256dh: 'p256dh1' },
			});

			await createNotificationSubscription(user.id, {
				endpoint: 'https://example.com/push/sub2',
				expirationTime: null,
				keys: { auth: 'auth2', p256dh: 'p256dh2' },
			});

			const subscriptions = await getNotificationSubscriptions(user.id);

			expect(subscriptions.data).toHaveLength(2);
			expect(subscriptions.data[0].subscriberId).toBe(user.id);
			expect(subscriptions.data[1].subscriberId).toBe(user.id);
		});
	});

	describe('deleteNotificationSubscription', () => {
		it('should delete a notification subscription', async () => {
			const subscription = {
				endpoint: 'https://example.com/push/to-delete',
				expirationTime: null,
				keys: { auth: 'auth-del', p256dh: 'p256dh-del' },
			};

			await createNotificationSubscription(user.id, subscription);
			await deleteNotificationSubscription(user.id, subscription.endpoint);

			// Verify subscription is deleted
			const deletedSubscription = await getNotificationSubscription(user.id, subscription.endpoint);
			expect(deletedSubscription).toBeNull();
		});
	});

	describe('storeNotification', () => {
		it('should store a notification', async () => {
			const notificationData = {
				title: 'Test Notification',
				content: 'This is a test notification',
				openUrl: '/test',
			};

			const notification = await storeNotification(user.id, notificationData);

			expect(notification).toBeDefined();
			expect(notification.id).toBeDefined();
			expect(notification.userId).toBe(user.id);
			expect(notification.title).toBe(notificationData.title);
			expect(notification.content).toBe(notificationData.content);
			expect(notification.openUrl).toBe(notificationData.openUrl);
			expect(notification.read).toBe(false);
			expect(notification.createdAt).toBeDefined();
		});

		it('should increment unread notification count', async () => {
			// Store a notification
			await storeNotification(user.id, {
				title: 'Count Test',
				content: 'Testing unread count',
			});

			// Check unread count
			const unreadCount = await getUnreadNotificationCount(user.id);
			expect(unreadCount).toBeDefined();
			expect(unreadCount?.count).toBeGreaterThan(0);
		});
	});

	describe('getStoredNotifications', () => {
		it('should return notifications for a user', async () => {
			// Store multiple notifications
			await storeNotification(user.id, {
				title: 'Notification 1',
				content: 'Content 1',
			});

			await storeNotification(user.id, {
				title: 'Notification 2',
				content: 'Content 2',
			});

			const notifications = await getStoredNotifications(user.id, {
				limit: 10,
			});

			expect(notifications.data).toHaveLength(2);
			expect(notifications.data[0].userId).toBe(user.id);
			expect(notifications.data[1].userId).toBe(user.id);
		});
	});

	describe('getFilteredStoredNotifications', () => {
		it('should return unread notifications', async () => {
			// Store multiple notifications
			const notif1 = await storeNotification(user.id, {
				title: 'Unread Notification',
				content: 'This is unread',
			});

			const notif2 = await storeNotification(user.id, {
				title: 'Read Notification',
				content: 'This is read',
			});

			// Mark one as read
			await updateNotification(notif2.id, { read: true });

			const unreadNotifications = await getFilteredStoredNotifications(user.id, {
				limit: 10,
				filter: 'unread',
			});

			expect(unreadNotifications.data).toHaveLength(1);
			expect(unreadNotifications.data[0].id).toBe(notif1.id);
			expect(unreadNotifications.data[0].read).toBe(false);
		});

		it('should return read notifications', async () => {
			// Store multiple notifications
			await storeNotification(user.id, {
				title: 'Unread Notification',
				content: 'This is unread',
			});

			const notif2 = await storeNotification(user.id, {
				title: 'Read Notification',
				content: 'This is read',
			});

			// Mark one as read
			await updateNotification(notif2.id, { read: true });

			const readNotifications = await getFilteredStoredNotifications(user.id, {
				limit: 10,
				filter: 'read',
			});

			expect(readNotifications.data).toHaveLength(1);
			expect(readNotifications.data[0].id).toBe(notif2.id);
			expect(readNotifications.data[0].read).toBe(true);
		});
	});

	describe('updateNotification', () => {
		it('should update a notification', async () => {
			const notification = await storeNotification(user.id, {
				title: 'Original Title',
				content: 'Original content',
			});

			const updatedNotification = await updateNotification(notification.id, {
				read: true,
			});

			expect(updatedNotification).toBeDefined();
			expect(updatedNotification.read).toBe(true);
		});

		it('should throw error for non-existent notification', async () => {
			const nonExistentId = 'non-existent-id';
			await expect(updateNotification(nonExistentId, { read: true })).rejects.toThrow(TRPCError);
		});

		it('should update unread count when marking as read', async () => {
			// Store a notification
			const notification = await storeNotification(user.id, {
				title: 'Count Update Test',
				content: 'Testing count update',
			});

			// Get initial count
			const initialCount = await getUnreadNotificationCount(user.id);
			const initialCountValue = initialCount?.count || 0;

			// Mark as read
			await updateNotification(notification.id, { read: true });

			// Check updated count
			const updatedCount = await getUnreadNotificationCount(user.id);
			expect(updatedCount?.count).toBe(Math.max(0, initialCountValue - 1));
		});
	});

	describe('markAllNotificationsAsRead', () => {
		it('should mark all notifications as read', async () => {
			// Store multiple unread notifications
			await storeNotification(user.id, {
				title: 'Unread 1',
				content: 'Content 1',
			});

			await storeNotification(user.id, {
				title: 'Unread 2',
				content: 'Content 2',
			});

			await markAllNotificationsAsRead(user.id);

			// Verify all notifications are read
			const unreadNotifications = await getFilteredStoredNotifications(user.id, {
				limit: 10,
				filter: 'unread',
			});

			expect(unreadNotifications.data).toHaveLength(0);

			// Verify unread count is reset
			const unreadCount = await getUnreadNotificationCount(user.id);
			expect(unreadCount?.count).toBe(0);
		});
	});

	describe('markBulkNotificationsAsRead', () => {
		it('should mark specific notifications as read', async () => {
			// Store multiple notifications
			const notif1 = await storeNotification(user.id, {
				title: 'To Mark Read 1',
				content: 'Content 1',
			});

			const notif2 = await storeNotification(user.id, {
				title: 'To Mark Read 2',
				content: 'Content 2',
			});

			const notif3 = await storeNotification(user.id, {
				title: 'Keep Unread',
				content: 'Content 3',
			});

			await markBulkNotificationsAsRead(user.id, [
				{ id: notif1.id, createdAt: notif1.createdAt },
				{ id: notif2.id, createdAt: notif2.createdAt },
			]);

			// Verify specific notifications are read
			const readNotifications = await getFilteredStoredNotifications(user.id, {
				limit: 10,
				filter: 'read',
			});

			expect(readNotifications.data).toHaveLength(2);
			expect(readNotifications.data.map(n => n.id)).toContain(notif1.id);
			expect(readNotifications.data.map(n => n.id)).toContain(notif2.id);

			// Verify one notification is still unread
			const unreadNotifications = await getFilteredStoredNotifications(user.id, {
				limit: 10,
				filter: 'unread',
			});

			expect(unreadNotifications.data).toHaveLength(1);
			expect(unreadNotifications.data[0].id).toBe(notif3.id);
		});
	});

	describe('unread notification count', () => {
		it('should add to unread notification count', async () => {
			await addUnreadNotificationToCount(user.id);

			const count = await getUnreadNotificationCount(user.id);
			expect(count).toBeDefined();
			expect(count?.count).toBeGreaterThan(0);
		});

		it('should remove from unread notification count', async () => {
			// Add to count first
			await addUnreadNotificationToCount(user.id);
			await addUnreadNotificationToCount(user.id);

			// Remove one
			await removeUnreadNotificationFromCount(user.id);

			const count = await getUnreadNotificationCount(user.id);
			expect(count).toBeDefined();
			expect(count?.count).toBe(1);
		});

		it('should update unread notification count', async () => {
			await updateUnreadNotificationCount(user.id, 5);

			const count = await getUnreadNotificationCount(user.id);
			expect(count).toBeDefined();
			expect(count?.count).toBe(5);
		});

		it('should not allow negative count', async () => {
			await updateUnreadNotificationCount(user.id, -5);

			const count = await getUnreadNotificationCount(user.id);
			expect(count).toBeDefined();
			expect(count?.count).toBe(0);
		});
	});

	describe('sendNotification', () => {
		it('should send notification to offline user', async () => {
			// Mock web-push
			const webpushMock = vi.fn().mockResolvedValue({ statusCode: 201 });
			vi.mock('web-push', () => ({
				setVapidDetails: vi.fn(),
				sendNotification: webpushMock,
			}));

			// Create a subscription
			await createNotificationSubscription(user.id, {
				endpoint: 'https://example.com/push/send-test',
				expirationTime: null,
				keys: { auth: 'auth-send', p256dh: 'p256dh-send' },
			});

			// Update user to offline
			user.status = 'offline';

			await sendNotification({
				user,
				payload: {
					title: 'Offline Notification',
					body: 'This is sent to an offline user',
					openUrl: '/test',
				},
			});

			// Verify notification was stored
			const notifications = await getStoredNotifications(user.id, { limit: 10 });
			expect(notifications.data).toHaveLength(1);
			expect(notifications.data[0].title).toBe('Offline Notification');
			expect(notifications.data[0].content).toBe('This is sent to an offline user');
		});

		it('should send notification through websocket for online user', async () => {
			// Mock websocket service
			const emitMock = vi.fn().mockResolvedValue({});
			vi.mock('../../../src/websockets/websockets.service', () => ({
				createAsyncWebsocketConnection: vi.fn().mockResolvedValue({
					publish: vi.fn().mockResolvedValue({}),
					publishAsync: vi.fn().mockResolvedValue({}),
				}),
				emitAsyncWebsocketEvent: emitMock,
			}));

			// Update user to online
			user.status = 'online';

			await sendNotification({
				user,
				payload: {
					title: 'Online Notification',
					body: 'This is sent to an online user',
				},
				opts: {
					offlineWebSocketMessage: {
						// @ts-expect-error I'm not populating all of the methods 😂✌️
						// Should probably mock a connection
						mqttConnection: { publish: vi.fn() },
						topic: 'test/topic',
					},
				},
			});

			// Verify emitAsyncWebsocketEvent was called
			expect(emitMock).toHaveBeenCalled();
		});
	});
});
