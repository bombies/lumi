import type { UpdateMomentMessageDto } from '../../../src/moments/moments.dto';
import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	createMomentDetails,
	createMomentMessage,
	createMomentTag,
	createRelationshipMomentTag,
	deleteMomentDetails,
	deleteMomentMessage,
	deleteMomentTag,
	deleteRelationshipMomentTag,
	getMessagesForMoment,
	getMomentDetailsById,
	getMomentMessageById,
	getMomentsByTag,
	getMomentsForRelationship,
	getMomentsForUser,
	getRelationshipMomentTags,
	getTagsForMoment,
	searchMoments,
	updateMomentDetails,
	updateMomentMessage,
} from '../../../src/moments/moment.service';
import { acceptRelationshipRequest, sendRelationshipRequest } from '../../../src/relationships/relationship.service';
import { createUser } from '../../../src/users/users.service';

describe('moments Service', () => {
	let user1: any;
	let user2: any;
	let relationship: any;

	beforeEach(async () => {
		// Create test users
		user1 = await createUser({
			email: 'momentuser1@example.com',
			username: 'momentuser1',
			firstName: 'Moment',
			lastName: 'User1',
		});

		user2 = await createUser({
			email: 'momentuser2@example.com',
			username: 'momentuser2',
			firstName: 'Moment',
			lastName: 'User2',
		});

		// Create a relationship between the users
		const request = await sendRelationshipRequest(user1.id, user2.id);
		relationship = await acceptRelationshipRequest(user2.id, request.id);
	});

	describe('createMomentDetails', () => {
		it('should create a moment', async () => {
			const momentData = {
				title: 'Test Moment',
				description: 'This is a test moment',
				objectKey: 'test-object-key.mp4',
			};

			const moment = await createMomentDetails(user1.id, relationship.id, momentData);

			expect(moment).toBeDefined();
			expect(moment.id).toBeDefined();
			expect(moment.title).toBe(momentData.title);
			expect(moment.description).toBe(momentData.description);
			expect(moment.objectKey).toBe(momentData.objectKey);
			expect(moment.userId).toBe(user1.id);
			expect(moment.relationshipId).toBe(relationship.id);
			expect(moment.normalizedTitle).toBe('test moment');
			expect(moment.createdAt).toBeDefined();
			expect(moment.videoUrl).toBeDefined(); // Should have a signed URL
		});

		it('should create a moment with tags', async () => {
			const momentData = {
				title: 'Test Moment with Tags',
				description: 'This is a test moment with tags',
				objectKey: 'test-object-key.mp4',
				tags: ['vacation', 'beach'],
			};

			const moment = await createMomentDetails(user1.id, relationship.id, momentData);

			expect(moment).toBeDefined();

			// Verify tags were created
			const tags = await getTagsForMoment(moment.id);
			expect(tags).toHaveLength(2);
			expect(tags.map(t => t.tag)).toContain('vacation');
			expect(tags.map(t => t.tag)).toContain('beach');
		});
	});

	describe('getMomentDetailsById', () => {
		it('should return a moment by ID', async () => {
			const momentData = {
				title: 'Get Moment Test',
				description: 'This is a test for getting a moment',
				objectKey: 'get-test-object-key.mp4',
			};

			const createdMoment = await createMomentDetails(user1.id, relationship.id, momentData);
			const retrievedMoment = await getMomentDetailsById(createdMoment.id);

			expect(retrievedMoment).toBeDefined();
			expect(retrievedMoment.id).toBe(createdMoment.id);
			expect(retrievedMoment.title).toBe(momentData.title);
			expect(retrievedMoment.videoUrl).toBeDefined(); // Should have a signed URL
		});

		it('should throw error for non-existent moment ID', async () => {
			const nonExistentId = 'non-existent-id';
			await expect(getMomentDetailsById(nonExistentId)).rejects.toThrow(TRPCError);
		});

		it('should return null with safeReturn option for non-existent moment ID', async () => {
			const nonExistentId = 'non-existent-id';
			const moment = await getMomentDetailsById(nonExistentId, { safeReturn: true });
			expect(moment).toBeNull();
		});
	});

	describe('getMomentsForRelationship', () => {
		it('should return moments for a relationship', async () => {
			// Create multiple moments
			await createMomentDetails(user1.id, relationship.id, {
				title: 'Relationship Moment 1',
				description: 'First moment for relationship',
				objectKey: 'rel-moment-1.mp4',
			});

			await createMomentDetails(user2.id, relationship.id, {
				title: 'Relationship Moment 2',
				description: 'Second moment for relationship',
				objectKey: 'rel-moment-2.mp4',
			});

			const moments = await getMomentsForRelationship(relationship.id, {
				limit: 10,
				order: 'desc',
			});

			expect(moments.data).toHaveLength(2);
			expect(moments.data[0].relationshipId).toBe(relationship.id);
			expect(moments.data[1].relationshipId).toBe(relationship.id);
		});
	});

	describe('getMomentsForUser', () => {
		it('should return moments created by a user', async () => {
			// Create multiple moments for user1
			await createMomentDetails(user1.id, relationship.id, {
				title: 'User1 Moment 1',
				description: 'First moment for user1',
				objectKey: 'user1-moment-1.mp4',
			});

			await createMomentDetails(user1.id, relationship.id, {
				title: 'User1 Moment 2',
				description: 'Second moment for user1',
				objectKey: 'user1-moment-2.mp4',
			});

			// Create a moment for user2
			await createMomentDetails(user2.id, relationship.id, {
				title: 'User2 Moment',
				description: 'Moment for user2',
				objectKey: 'user2-moment.mp4',
			});

			const moments = await getMomentsForUser(user1.id, {
				limit: 10,
				order: 'desc',
			});

			expect(moments.data).toHaveLength(2);
			expect(moments.data[0].userId).toBe(user1.id);
			expect(moments.data[1].userId).toBe(user1.id);
		});
	});

	describe('updateMomentDetails', () => {
		it('should update a moment', async () => {
			const momentData = {
				title: 'Original Title',
				description: 'Original description',
				objectKey: 'original-key.mp4',
			};

			const createdMoment = await createMomentDetails(user1.id, relationship.id, momentData);

			const updateData = {
				title: 'Updated Title',
				description: 'Updated description',
			};

			const updatedMoment = await updateMomentDetails(createdMoment.id, updateData);

			expect(updatedMoment).toBeDefined();
			expect(updatedMoment.title).toBe(updateData.title);
			expect(updatedMoment.description).toBe(updateData.description);
			expect(updatedMoment.normalizedTitle).toBe('updated title');
			expect(updatedMoment.objectKey).toBe(momentData.objectKey); // Should remain unchanged
		});

		it('should update moment tags', async () => {
			const momentData = {
				title: 'Moment with Tags',
				description: 'Original description',
				objectKey: 'tags-key.mp4',
				tags: ['original', 'tag'],
			};

			const createdMoment = await createMomentDetails(user1.id, relationship.id, momentData);

			const updateData = {
				tags: ['updated', 'tags', 'list'],
			};

			const updatedMoment = await updateMomentDetails(createdMoment.id, updateData);

			expect(updatedMoment).toBeDefined();

			// Verify tags were updated
			const tags = await getTagsForMoment(updatedMoment.id);
			expect(tags).toHaveLength(3);
			expect(tags.map(t => t.tag)).toContain('updated');
			expect(tags.map(t => t.tag)).toContain('tags');
			expect(tags.map(t => t.tag)).toContain('list');
			expect(tags.map(t => t.tag)).not.toContain('original');
			expect(tags.map(t => t.tag)).not.toContain('tag');
		});
	});

	describe('deleteMomentDetails', () => {
		it('should delete a moment', async () => {
			const momentData = {
				title: 'Moment to Delete',
				description: 'This moment will be deleted',
				objectKey: 'delete-key.mp4',
			};

			const createdMoment = await createMomentDetails(user1.id, relationship.id, momentData);

			await deleteMomentDetails(createdMoment.id);

			// Verify moment is deleted
			await expect(getMomentDetailsById(createdMoment.id)).rejects.toThrow(TRPCError);
		});
	});

	describe('createMomentMessage', () => {
		it('should create a message for a moment', async () => {
			// Create a moment first
			const moment = await createMomentDetails(user1.id, relationship.id, {
				title: 'Moment with Messages',
				description: 'This moment will have messages',
				objectKey: 'message-key.mp4',
			});

			const messageData = {
				momentId: moment.id,
				content: 'This is a test message',
			};

			const message = await createMomentMessage(user1.id, messageData);

			expect(message).toBeDefined();
			expect(message.id).toBeDefined();
			expect(message.momentId).toBe(moment.id);
			expect(message.content).toBe(messageData.content);
			expect(message.senderId).toBe(user1.id);
			expect(message.timestamp).toBeDefined();
			expect(message.state).toBe('delivered');
		});

		it('should create a message with custom ID and timestamp', async () => {
			// Create a moment first
			const moment = await createMomentDetails(user1.id, relationship.id, {
				title: 'Moment with Custom Message',
				description: 'This moment will have a custom message',
				objectKey: 'custom-message-key.mp4',
			});

			const customId = 'custom-message-id';
			const customTimestamp = new Date().toISOString();

			const messageData = {
				momentId: moment.id,
				content: 'This is a custom message',
				id: customId,
				timestamp: customTimestamp,
			};

			const message = await createMomentMessage(user1.id, messageData);

			expect(message).toBeDefined();
			expect(message.id).toBe(customId);
			expect(message.timestamp).toBe(customTimestamp);
		});
	});

	describe('getMomentMessageById', () => {
		it('should return a message by ID', async () => {
			// Create a moment first
			const moment = await createMomentDetails(user1.id, relationship.id, {
				title: 'Moment for Message Retrieval',
				description: 'This moment will have a retrievable message',
				objectKey: 'retrieve-message-key.mp4',
			});

			const messageData = {
				momentId: moment.id,
				content: 'Message to retrieve',
			};

			const createdMessage = await createMomentMessage(user1.id, messageData);
			const retrievedMessage = await getMomentMessageById(createdMessage.id);

			expect(retrievedMessage).toBeDefined();
			expect(retrievedMessage?.id).toBe(createdMessage.id);
			expect(retrievedMessage?.content).toBe(messageData.content);
		});
	});

	describe('getMessagesForMoment', () => {
		it('should return messages for a moment', async () => {
			// Create a moment first
			const moment = await createMomentDetails(user1.id, relationship.id, {
				title: 'Moment with Multiple Messages',
				description: 'This moment will have multiple messages',
				objectKey: 'multiple-messages-key.mp4',
			});

			// Create multiple messages
			await createMomentMessage(user1.id, {
				momentId: moment.id,
				content: 'First message',
			});

			await createMomentMessage(user2.id, {
				momentId: moment.id,
				content: 'Second message',
			});

			const messages = await getMessagesForMoment({
				momentId: moment.id,
				limit: 10,
				order: 'desc',
			});

			expect(messages.data).toHaveLength(2);
			expect(messages.data[0].momentId).toBe(moment.id);
			expect(messages.data[1].momentId).toBe(moment.id);
		});
	});

	describe('updateMomentMessage', () => {
		it('should update a message', async () => {
			// Create a moment first
			const moment = await createMomentDetails(user1.id, relationship.id, {
				title: 'Moment for Message Update',
				description: 'This moment will have an updated message',
				objectKey: 'update-message-key.mp4',
			});

			const messageData = {
				momentId: moment.id,
				content: 'Original message content',
			};

			const createdMessage = await createMomentMessage(user1.id, messageData);

			const updateData = {
				messageId: createdMessage.id,
				content: 'Updated message content',
			};

			const updatedMessage = await updateMomentMessage(updateData);

			expect(updatedMessage).toBeDefined();
			expect(updatedMessage.content).toBe(updateData.content);
			expect(updatedMessage.updatedAt).toBeDefined();
		});

		it('should update message state', async () => {
			// Create a moment first
			const moment = await createMomentDetails(user1.id, relationship.id, {
				title: 'Moment for Message State Update',
				description: 'This moment will have a message with updated state',
				objectKey: 'state-update-key.mp4',
			});

			const messageData = {
				momentId: moment.id,
				content: 'Message with state',
			};

			const createdMessage = await createMomentMessage(user1.id, messageData);

			const updateData = {
				messageId: createdMessage.id,
				state: 'read',
			} satisfies UpdateMomentMessageDto;

			const updatedMessage = await updateMomentMessage(updateData);

			expect(updatedMessage).toBeDefined();
			expect(updatedMessage.state).toBe('read');
		});

		it('should add reaction to message', async () => {
			// Create a moment first
			const moment = await createMomentDetails(user1.id, relationship.id, {
				title: 'Moment for Message Reaction',
				description: 'This moment will have a message with a reaction',
				objectKey: 'reaction-key.mp4',
			});

			const messageData = {
				momentId: moment.id,
				content: 'Message to react to',
			};

			const createdMessage = await createMomentMessage(user1.id, messageData);

			const updateData = {
				messageId: createdMessage.id,
				reaction: '❤️',
			};

			const updatedMessage = await updateMomentMessage(updateData);

			expect(updatedMessage).toBeDefined();
			expect(updatedMessage.reaction).toBe('❤️');
		});
	});

	describe('deleteMomentMessage', () => {
		it('should mark a message as deleted', async () => {
			// Create a moment first
			const moment = await createMomentDetails(user1.id, relationship.id, {
				title: 'Moment for Message Deletion',
				description: 'This moment will have a deleted message',
				objectKey: 'delete-message-key.mp4',
			});

			const messageData = {
				momentId: moment.id,
				content: 'Message to delete',
			};

			const createdMessage = await createMomentMessage(user1.id, messageData);

			const deletedMessage = await deleteMomentMessage(createdMessage.id);

			expect(deletedMessage).toBeDefined();
			expect(deletedMessage.content).toBe('[deleted]');
			expect(deletedMessage.isDeleted).toBe(true);
		});
	});

	describe('createRelationshipMomentTag', () => {
		it('should create a relationship moment tag', async () => {
			const tagData = {
				tag: 'relationship-tag',
			};

			const tag = await createRelationshipMomentTag(relationship.id, tagData);

			expect(tag).toBeDefined();
			expect(tag.tag).toBe('relationshiptag'); // Tags are normalized
			expect(tag.relationshipId).toBe(relationship.id);
			expect(tag.associationCount).toBe(0);
		});

		it('should throw error when tag already exists', async () => {
			const tagData = {
				tag: 'duplicate-tag',
			};

			await createRelationshipMomentTag(relationship.id, tagData);

			await expect(createRelationshipMomentTag(relationship.id, tagData)).rejects.toThrow(TRPCError);
		});
	});

	describe('getRelationshipMomentTags', () => {
		it('should return tags for a relationship', async () => {
			// Create multiple tags
			await createRelationshipMomentTag(relationship.id, { tag: 'tag1' });
			await createRelationshipMomentTag(relationship.id, { tag: 'tag2' });

			const tags = await getRelationshipMomentTags(relationship.id, {
				limit: 10,
			});

			expect(tags.data).toHaveLength(2);
			expect(tags.data[0].relationshipId).toBe(relationship.id);
			expect(tags.data[1].relationshipId).toBe(relationship.id);
		});

		it('should filter tags by query', async () => {
			// Create multiple tags
			await createRelationshipMomentTag(relationship.id, { tag: 'apple' });
			await createRelationshipMomentTag(relationship.id, { tag: 'banana' });
			await createRelationshipMomentTag(relationship.id, { tag: 'apricot' });

			const tags = await getRelationshipMomentTags(relationship.id, {
				limit: 10,
				query: 'ap',
			});

			expect(tags.data).toHaveLength(2);
			expect(tags.data.map(t => t.tag)).toContain('apple');
			expect(tags.data.map(t => t.tag)).toContain('apricot');
		});
	});

	describe('deleteRelationshipMomentTag', () => {
		it('should delete a relationship moment tag', async () => {
			const tagData = {
				tag: 'tag-to-delete',
			};

			await createRelationshipMomentTag(relationship.id, tagData);

			await deleteRelationshipMomentTag(relationship.id, 'tag-to-delete');

			// Verify tag is deleted
			const tags = await getRelationshipMomentTags(relationship.id, {
				limit: 10,
			});

			expect(tags.data.map(t => t.tag)).not.toContain('tagtodelete');
		});
	});

	describe('createMomentTag', () => {
		it('should create a tag for a moment', async () => {
			// Create a moment first
			const moment = await createMomentDetails(user1.id, relationship.id, {
				title: 'Moment for Tagging',
				description: 'This moment will be tagged',
				objectKey: 'tag-moment-key.mp4',
			});

			const tagData = {
				momentId: moment.id,
				tag: 'moment-specific-tag',
			};

			const tag = await createMomentTag(user1.id, relationship.id, tagData);

			expect(tag).toBeDefined();
			expect(tag.tag).toBe('momentspecifictag'); // Tags are normalized
			expect(tag.momentId).toBe(moment.id);
			expect(tag.relationshipId).toBe(relationship.id);
			expect(tag.taggerId).toBe(user1.id);
		});
	});

	describe('getTagsForMoment', () => {
		it('should return tags for a moment', async () => {
			// Create a moment first
			const moment = await createMomentDetails(user1.id, relationship.id, {
				title: 'Moment with Multiple Tags',
				description: 'This moment will have multiple tags',
				objectKey: 'multiple-tags-key.mp4',
				tags: ['tag1', 'tag2', 'tag3'],
			});

			const tags = await getTagsForMoment(moment.id);

			expect(tags).toHaveLength(3);
			expect(tags.map(t => t.momentId)).toEqual([moment.id, moment.id, moment.id]);
		});
	});

	describe('deleteMomentTag', () => {
		it('should delete a tag from a moment', async () => {
			// Create a moment with tags
			const moment = await createMomentDetails(user1.id, relationship.id, {
				title: 'Moment for Tag Deletion',
				description: 'This moment will have a tag deleted',
				objectKey: 'delete-tag-key.mp4',
				tags: ['keep', 'delete'],
			});

			await deleteMomentTag({
				momentId: moment.id,
				tag: 'delete',
			});

			// Verify tag is deleted
			const tags = await getTagsForMoment(moment.id);
			expect(tags).toHaveLength(1);
			expect(tags[0].tag).toBe('keep');
		});
	});

	describe('getMomentsByTag', () => {
		it('should return moments with a specific tag', async () => {
			// Create moments with tags
			const moment1 = await createMomentDetails(user1.id, relationship.id, {
				title: 'Moment with Target Tag',
				description: 'This moment has the target tag',
				objectKey: 'target-tag-key-1.mp4',
				tags: ['target', 'other'],
			});

			const moment2 = await createMomentDetails(user2.id, relationship.id, {
				title: 'Another Moment with Target Tag',
				description: 'This moment also has the target tag',
				objectKey: 'target-tag-key-2.mp4',
				tags: ['target', 'different'],
			});

			const moment3 = await createMomentDetails(user1.id, relationship.id, {
				title: 'Moment without Target Tag',
				description: 'This moment does not have the target tag',
				objectKey: 'no-target-tag-key.mp4',
				tags: ['other', 'different'],
			});

			const moments = await getMomentsByTag(relationship.id, {
				tagQuery: 'target',
				limit: 10,
				order: 'desc',
			});

			expect(moments.data).toHaveLength(2);
			expect(moments.data.map(m => m.id)).toContain(moment1.id);
			expect(moments.data.map(m => m.id)).toContain(moment2.id);
			expect(moments.data.map(m => m.id)).not.toContain(moment3.id);
		});
	});

	describe('searchMoments', () => {
		it('should search moments by title', async () => {
			// Create moments with different titles
			const moment1 = await createMomentDetails(user1.id, relationship.id, {
				title: 'Vacation in Hawaii',
				description: 'Our trip to Hawaii',
				objectKey: 'hawaii-key.mp4',
			});

			const moment2 = await createMomentDetails(user2.id, relationship.id, {
				title: 'Hawaii Sunset',
				description: 'Beautiful sunset in Hawaii',
				objectKey: 'sunset-key.mp4',
			});

			const moment3 = await createMomentDetails(user1.id, relationship.id, {
				title: 'Birthday Party',
				description: 'My birthday celebration',
				objectKey: 'birthday-key.mp4',
			});

			const results = await searchMoments(relationship.id, {
				query: 'hawaii',
				limit: 10,
				order: 'desc',
			});

			expect(results.data).toHaveLength(2);
			expect(results.data.map(m => m.id)).toContain(moment1.id);
			expect(results.data.map(m => m.id)).toContain(moment2.id);
			expect(results.data.map(m => m.id)).not.toContain(moment3.id);
		});

		it('should search moments by tag', async () => {
			// Create moments with different tags
			const moment1 = await createMomentDetails(user1.id, relationship.id, {
				title: 'Beach Day',
				description: 'Day at the beach',
				objectKey: 'beach-key.mp4',
				tags: ['vacation', 'summer'],
			});

			const moment2 = await createMomentDetails(user2.id, relationship.id, {
				title: 'Mountain Hike',
				description: 'Hiking in the mountains',
				objectKey: 'hike-key.mp4',
				tags: ['vacation', 'adventure'],
			});

			const moment3 = await createMomentDetails(user1.id, relationship.id, {
				title: 'Dinner Date',
				description: 'Romantic dinner',
				objectKey: 'dinner-key.mp4',
				tags: ['date', 'romantic'],
			});

			const results = await searchMoments(relationship.id, {
				query: 'vacation',
				limit: 10,
				order: 'desc',
			});

			expect(results.data).toHaveLength(2);
			expect(results.data.map(m => m.id)).toContain(moment1.id);
			expect(results.data.map(m => m.id)).toContain(moment2.id);
			expect(results.data.map(m => m.id)).not.toContain(moment3.id);
		});
	});
});
