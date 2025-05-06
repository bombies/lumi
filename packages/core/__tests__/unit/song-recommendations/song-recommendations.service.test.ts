import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { acceptRelationshipRequest, sendRelationshipRequest } from '../../../src/relationships/relationship.service';
import {
	createSongRecommendation,
	deleteSongRecommendation,
	deleteSongRecommendationsByRelationshipId,
	getSongRecommendationById,
	getSongRecommendationByTrackIdForUser,
	getSongRecommendations,
	getSongRecommendationsByRelationshipId,
	updateSongRecommendation,
} from '../../../src/song-recommendations/song-recommendations.service';
import { createUser } from '../../../src/users/users.service';

describe('song Recommendations Service', () => {
	let user1: any;
	let user2: any;
	let relationship: any;

	beforeEach(async () => {
		// Create test users
		user1 = await createUser({
			email: 'songuser1@example.com',
			username: 'songuser1',
			firstName: 'Song',
			lastName: 'User1',
		});

		user2 = await createUser({
			email: 'songuser2@example.com',
			username: 'songuser2',
			firstName: 'Song',
			lastName: 'User2',
		});

		// Create a relationship between the users
		const request = await sendRelationshipRequest(user1.id, user2.id);
		relationship = await acceptRelationshipRequest(user2.id, request.id);
	});

	describe('createSongRecommendation', () => {
		it('should create a song recommendation', async () => {
			const songData = {
				id: 'spotify-track-id-1',
				uri: 'spotify:track:123456',
				name: 'Test Song',
				artistName: 'Test Artist',
				albumImage: 'https://example.com/album.jpg',
				duration: 180000,
			};

			const recommendation = await createSongRecommendation(user1.id, relationship.id, songData);

			expect(recommendation).toBeDefined();
			expect(recommendation.id).toBeDefined();
			expect(recommendation.recommenderId).toBe(user1.id);
			expect(recommendation.relationshipId).toBe(relationship.id);
			expect(recommendation.listened).toBe(false);
			expect(recommendation.track.id).toBe(songData.id);
			expect(recommendation.track.name).toBe(songData.name);
			expect(recommendation.track.artistName).toBe(songData.artistName);
			expect(recommendation.createdAt).toBeDefined();
		});

		it('should throw error when recommending the same track again', async () => {
			const songData = {
				id: 'spotify-track-id-duplicate',
				uri: 'spotify:track:duplicate',
				name: 'Duplicate Song',
				artistName: 'Test Artist',
				albumImage: 'https://example.com/album.jpg',
				duration: 180000,
			};

			// Create first recommendation
			await createSongRecommendation(user1.id, relationship.id, songData);

			// Try to create duplicate recommendation
			await expect(createSongRecommendation(user1.id, relationship.id, songData)).rejects.toThrow(TRPCError);
		});
	});

	describe('getSongRecommendationByTrackIdForUser', () => {
		it('should return a recommendation by track ID', async () => {
			const trackId = 'spotify-track-id-get';
			const songData = {
				id: trackId,
				uri: 'spotify:track:get',
				name: 'Get Track Song',
				artistName: 'Test Artist',
				albumImage: 'https://example.com/album.jpg',
				duration: 180000,
			};

			await createSongRecommendation(user1.id, relationship.id, songData);
			const recommendation = await getSongRecommendationByTrackIdForUser(user1.id, trackId);

			expect(recommendation).toBeDefined();
			expect(recommendation?.track.id).toBe(trackId);
			expect(recommendation?.recommenderId).toBe(user1.id);
		});

		it('should return undefined for non-existent track ID', async () => {
			const nonExistentId = 'non-existent-track-id';
			const recommendation = await getSongRecommendationByTrackIdForUser(user1.id, nonExistentId);
			expect(recommendation).toBeUndefined();
		});
	});

	describe('getSongRecommendations', () => {
		it('should return recommendations for a partner', async () => {
			// Create recommendations from user1 to user2
			await createSongRecommendation(user1.id, relationship.id, {
				id: 'spotify-track-id-rec1',
				uri: 'spotify:track:rec1',
				name: 'Recommendation 1',
				artistName: 'Artist 1',
				albumImage: 'https://example.com/album1.jpg',
				duration: 180000,
			});

			await createSongRecommendation(user1.id, relationship.id, {
				id: 'spotify-track-id-rec2',
				uri: 'spotify:track:rec2',
				name: 'Recommendation 2',
				artistName: 'Artist 2',
				albumImage: 'https://example.com/album2.jpg',
				duration: 210000,
			});

			const recommendations = await getSongRecommendations(user1.id, relationship.id, {
				limit: 10,
				order: 'desc',
			});

			expect(recommendations.data).toHaveLength(2);
			expect(recommendations.data[0].recommenderId).toBe(user1.id);
			expect(recommendations.data[1].recommenderId).toBe(user1.id);
		});

		it('should filter by listened status', async () => {
			// Create recommendations with different listened status
			const rec1 = await createSongRecommendation(user1.id, relationship.id, {
				id: 'spotify-track-id-listened',
				uri: 'spotify:track:listened',
				name: 'Listened Song',
				artistName: 'Artist 1',
				albumImage: 'https://example.com/album1.jpg',
				duration: 180000,
			});

			await createSongRecommendation(user1.id, relationship.id, {
				id: 'spotify-track-id-unlistened',
				uri: 'spotify:track:unlistened',
				name: 'Unlistened Song',
				artistName: 'Artist 2',
				albumImage: 'https://example.com/album2.jpg',
				duration: 210000,
			});

			// Mark one as listened
			await updateSongRecommendation(rec1.id, { listened: true });

			// Get unlistened recommendations
			const unlistenedRecs = await getSongRecommendations(user1.id, relationship.id, {
				limit: 10,
				order: 'desc',
				filter: 'unlistened',
			});

			expect(unlistenedRecs.data).toHaveLength(1);
			expect(unlistenedRecs.data[0].track.name).toBe('Unlistened Song');
			expect(unlistenedRecs.data[0].listened).toBe(false);

			// Get listened recommendations
			const listenedRecs = await getSongRecommendations(user1.id, relationship.id, {
				limit: 10,
				order: 'desc',
				filter: 'listened',
			});

			expect(listenedRecs.data).toHaveLength(1);
			expect(listenedRecs.data[0].track.name).toBe('Listened Song');
			expect(listenedRecs.data[0].listened).toBe(true);
		});
	});

	describe('getSongRecommendationsByRelationshipId', () => {
		it('should return all recommendations for a relationship', async () => {
			// Create recommendations from both users
			await createSongRecommendation(user1.id, relationship.id, {
				id: 'spotify-track-id-user1',
				uri: 'spotify:track:user1',
				name: 'User1 Song',
				artistName: 'Artist 1',
				albumImage: 'https://example.com/album1.jpg',
				duration: 180000,
			});

			await createSongRecommendation(user2.id, relationship.id, {
				id: 'spotify-track-id-user2',
				uri: 'spotify:track:user2',
				name: 'User2 Song',
				artistName: 'Artist 2',
				albumImage: 'https://example.com/album2.jpg',
				duration: 210000,
			});

			const recommendations = await getSongRecommendationsByRelationshipId(relationship.id, {
				limit: 10,
				order: 'desc',
			});

			expect(recommendations.data).toHaveLength(2);
			expect(recommendations.data.map(r => r.recommenderId)).toContain(user1.id);
			expect(recommendations.data.map(r => r.recommenderId)).toContain(user2.id);
		});
	});

	describe('getSongRecommendationById', () => {
		it('should return a recommendation by ID', async () => {
			const songData = {
				id: 'spotify-track-id-get-by-id',
				uri: 'spotify:track:get-by-id',
				name: 'Get By ID Song',
				artistName: 'Test Artist',
				albumImage: 'https://example.com/album.jpg',
				duration: 180000,
			};

			const createdRec = await createSongRecommendation(user1.id, relationship.id, songData);
			const recommendation = await getSongRecommendationById(createdRec.id);

			expect(recommendation).toBeDefined();
			expect(recommendation?.id).toBe(createdRec.id);
			expect(recommendation?.track.name).toBe(songData.name);
		});

		it('should return null for non-existent recommendation ID', async () => {
			const nonExistentId = 'non-existent-rec-id';
			const recommendation = await getSongRecommendationById(nonExistentId);
			expect(recommendation).toBeNull();
		});
	});

	describe('updateSongRecommendation', () => {
		it('should update a recommendation', async () => {
			const songData = {
				id: 'spotify-track-id-update',
				uri: 'spotify:track:update',
				name: 'Update Song',
				artistName: 'Test Artist',
				albumImage: 'https://example.com/album.jpg',
				duration: 180000,
			};

			const createdRec = await createSongRecommendation(user1.id, relationship.id, songData);

			const updateData = {
				listened: true,
				rating: 8,
				comments: 'Great song!',
			};

			const updatedRec = await updateSongRecommendation(createdRec.id, updateData);

			expect(updatedRec).toBeDefined();
			expect(updatedRec.listened).toBe(updateData.listened);
			expect(updatedRec.rating).toBe(updateData.rating);
			expect(updatedRec.comments).toBe(updateData.comments);
			expect(updatedRec.updatedAt).toBeDefined();
		});

		it('should throw error for non-existent recommendation', async () => {
			const nonExistentId = 'non-existent-rec-id';
			await expect(updateSongRecommendation(nonExistentId, { listened: true })).rejects.toThrow(TRPCError);
		});
	});

	describe('deleteSongRecommendation', () => {
		it('should delete a recommendation', async () => {
			const songData = {
				id: 'spotify-track-id-delete',
				uri: 'spotify:track:delete',
				name: 'Delete Song',
				artistName: 'Test Artist',
				albumImage: 'https://example.com/album.jpg',
				duration: 180000,
			};

			const createdRec = await createSongRecommendation(user1.id, relationship.id, songData);

			const deletedRec = await deleteSongRecommendation(createdRec.id);

			expect(deletedRec).toBeDefined();
			expect(deletedRec.id).toBe(createdRec.id);

			// Verify recommendation is deleted
			const retrievedRec = await getSongRecommendationById(createdRec.id);
			expect(retrievedRec).toBeNull();
		});

		it('should throw error for non-existent recommendation', async () => {
			const nonExistentId = 'non-existent-rec-id';
			await expect(deleteSongRecommendation(nonExistentId)).rejects.toThrow(TRPCError);
		});
	});

	describe('deleteSongRecommendationsByRelationshipId', () => {
		it('should delete all recommendations for a relationship', async () => {
			// Create multiple recommendations
			await createSongRecommendation(user1.id, relationship.id, {
				id: 'spotify-track-id-rel-del-1',
				uri: 'spotify:track:rel-del-1',
				name: 'Relationship Delete 1',
				artistName: 'Artist 1',
				albumImage: 'https://example.com/album1.jpg',
				duration: 180000,
			});

			await createSongRecommendation(user2.id, relationship.id, {
				id: 'spotify-track-id-rel-del-2',
				uri: 'spotify:track:rel-del-2',
				name: 'Relationship Delete 2',
				artistName: 'Artist 2',
				albumImage: 'https://example.com/album2.jpg',
				duration: 210000,
			});

			await deleteSongRecommendationsByRelationshipId(relationship.id);

			// Verify recommendations are deleted
			const recommendations = await getSongRecommendationsByRelationshipId(relationship.id, {
				limit: 10,
				order: 'desc',
			});

			expect(recommendations.data).toHaveLength(0);
		});
	});
});
