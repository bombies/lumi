import type { Affirmation } from '../../src/affirmations/affirmations.types';
import type { Moment } from '../../src/moments/moment.types';
import type { StoredNotification } from '../../src/notifications/notification.types';
import type { Relationship } from '../../src/relationships/relationship.types';
import type { SongRecommendation } from '../../src/song-recommendations/song-recommendation.types';
import type { User } from '../../src/users/user.types';
import { v4 as uuidv4 } from 'uuid';

export class TestDataFactory {
	static createUser(overrides: Partial<User> = {}): User {
		const id = overrides.id || uuidv4();
		return {
			id,
			email: `user-${id}@example.com`,
			username: `user-${id}`,
			firstName: `First-${id}`,
			lastName: `Last-${id}`,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			status: 'online',
			...overrides,
		};
	}

	static createRelationship(overrides: Partial<Relationship> = {}): Relationship {
		const id = overrides.id || uuidv4();
		return {
			id,
			partner1: overrides.partner1 || uuidv4(),
			partner2: overrides.partner2 || uuidv4(),
			createdAt: new Date().toISOString(),
			...overrides,
		};
	}

	static createAffirmation(overrides: Partial<Affirmation> = {}): Affirmation {
		const id = overrides.id || uuidv4();
		return {
			id,
			affirmation: `Test affirmation ${id}`,
			selectedCount: 0,
			relationshipId: overrides.relationshipId || uuidv4(),
			ownerId: overrides.ownerId || uuidv4(),
			...overrides,
		};
	}

	static createMoment(overrides: Partial<Moment> = {}): Moment {
		const id = overrides.id || uuidv4();
		return {
			id,
			title: `Test moment ${id}`,
			normalizedTitle: `test moment ${id}`,
			description: `Description for test moment ${id}`,
			objectKey: `test-object-key-${id}.mp4`,
			thumbnailObjectKey: `test-thumbnail-key-${id}.png`,
			createdAt: new Date().toISOString(),
			relationshipId: overrides.relationshipId || uuidv4(),
			userId: overrides.userId || uuidv4(),
			...overrides,
		};
	}

	static createSongRecommendation(overrides: Partial<SongRecommendation> = {}): SongRecommendation {
		const id = overrides.id || uuidv4();
		return {
			id,
			listened: false,
			recommenderId: overrides.recommenderId || uuidv4(),
			relationshipId: overrides.relationshipId || uuidv4(),
			createdAt: new Date().toISOString(),
			track: {
				id: `track-${uuidv4()}`,
				uri: `spotify:track:${uuidv4()}`,
				name: `Test Track ${id}`,
				artistName: `Test Artist ${id}`,
				albumImage: `https://example.com/album-${id}.jpg`,
				duration: 180000,
				...overrides.track,
			},
			...overrides,
		};
	}

	static createNotification(overrides: Partial<StoredNotification> = {}): StoredNotification {
		const id = overrides.id || uuidv4();
		return {
			id,
			userId: overrides.userId || uuidv4(),
			title: `Test notification ${id}`,
			content: `This is a test notification ${id}`,
			createdAt: new Date().toISOString(),
			read: false,
			...overrides,
		};
	}
}
