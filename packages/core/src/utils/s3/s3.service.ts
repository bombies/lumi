import {
	DeleteObjectCommand,
	DeleteObjectsCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StreamingBlobPayloadInputTypes } from '@smithy/types';

export class StorageClient {
	private readonly client = new S3Client();

	constructor(private readonly bucket: string) {}

	uploadObject(key: string, body: StreamingBlobPayloadInputTypes) {
		const uploadClient = new Upload({
			client: this.client,
			params: {
				Bucket: this.bucket,
				Key: key,
				Body: body,
			},
		});

		uploadClient.on('httpUploadProgress', progress => {
			console.log(`Uploaded ${progress.loaded} of ${progress.total} bytes for ${key}`);
		});

		return uploadClient.done();
	}

	uploadObjects(objects: { key: string; body: StreamingBlobPayloadInputTypes }[]) {
		return Promise.all(
			objects.map(object =>
				this.client.send(
					new PutObjectCommand({
						Bucket: this.bucket,
						Key: object.key,
						Body: object.body,
					}),
				),
			),
		);
	}

	getObject(key: string) {
		return this.client.send(
			new GetObjectCommand({
				Bucket: this.bucket,
				Key: key,
			}),
		);
	}

	getBulkObjects(keys: string[]) {
		return Promise.all(
			keys.map(key =>
				this.client.send(
					new GetObjectCommand({
						Bucket: this.bucket,
						Key: key,
					}),
				),
			),
		);
	}

	/**
	 * Get a presigned URL for an object in the bucket
	 * @param key The key of the object
	 * @param expires The time in seconds until the URL expires
	 */
	async getSignedGetUrl(
		key: string,
		opts?: {
			expires?: number;
			contentType?: string;
		},
	) {
		return getSignedUrl(
			this.client,
			new GetObjectCommand({
				Bucket: this.bucket,
				Key: key,
				ResponseContentType: opts?.contentType,
			}),
			{
				expiresIn: opts?.expires ?? 600,
			},
		);
	}

	/**
	 * Get a presigned URL for a PUT request to the bucket
	 * @param key The key of the object
	 * @param expires The time in seconds until the URL expires
	 */
	async getSignedPutUrl(
		key: string,
		opts?: {
			expires?: number;
			contentType?: string;
		},
	) {
		return getSignedUrl(
			this.client,
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: key,
				ContentType: opts?.contentType,
			}),
			{
				expiresIn: opts?.expires,
			},
		);
	}

	deleteObject(key: string) {
		return this.client.send(
			new DeleteObjectCommand({
				Bucket: this.bucket,
				Key: key,
			}),
		);
	}

	deleteObjects(keys: string[]) {
		return this.client.send(
			new DeleteObjectsCommand({
				Bucket: this.bucket,
				Delete: {
					Objects: keys.map(key => ({ Key: key })),
				},
			}),
		);
	}

	async copyObject(sourceKey: string, destinationClient: StorageClient, destinationKey: string = sourceKey) {
		const sourceObject = (await this.getObject(sourceKey)).Body;
		if (!sourceObject) throw new Error(`Object with key ${sourceKey} not found`);
		return destinationClient.uploadObject(destinationKey, sourceObject);
	}

	async moveObject(sourceKey: string, destinationClient: StorageClient, destinationKey: string = sourceKey) {
		await this.copyObject(sourceKey, destinationClient, destinationKey);
		return this.deleteObject(sourceKey);
	}
}

type ReplaceVariablesArgs = {
	withHost?: boolean;
};

export class ContentPaths {
	private static USER_AVATAR = 'user/{userId}/avatar/';
	private static RELATIONSHIP_MOMENTS = 'private/relationships/{relationshipId}/moments/';

	private constructor() {}

	private static replaceVariables(path: string, variables: Record<string, string>, args?: ReplaceVariablesArgs) {
		const val = path.replace(/{(\w+)}/g, (match, key) => variables[key] || match);
		return `${args?.withHost ? process.env.CDN_URL + '/' : ''}${val}`;
	}

	static userAvatar(userId: string, file: string, args?: ReplaceVariablesArgs) {
		return this.replaceVariables(this.USER_AVATAR, { userId }, args) + file;
	}

	static relationshipMoments(relationshipId: string, file: string, args?: ReplaceVariablesArgs) {
		return this.replaceVariables(this.RELATIONSHIP_MOMENTS, { relationshipId }, args) + file;
	}
}
