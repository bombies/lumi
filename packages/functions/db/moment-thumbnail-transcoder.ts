import { updateMomentDetails } from '@lumi/core/moments/moment.service';
import { ContentPaths, StorageClient } from '@lumi/core/utils/s3/s3.service';
import { DynamoDBStreamEvent, Handler } from 'aws-lambda';
import { spawnSync } from 'child_process';
import ffmpeg from 'ffmpeg-static';
import { promises as fs } from 'fs';
import path from 'path';
import { Resource } from 'sst';

const storageBucket = new StorageClient(Resource.ContentBucket.name);

export const handler: Handler<DynamoDBStreamEvent> = async event => {
	for (const record of event.Records) {
		console.log('Received INSERT event for moment details record!');
		if (!ffmpeg) {
			console.error('Could not find an instance of ffmpeg!');
			continue;
		}
		if (!record.eventName || !record.dynamodb || !record.dynamodb.Keys) continue;

		// console.log(record.eventName, record.dynamodb?.Keys?.pk?.S, record.dynamodb?.Keys?.sk?.S);

		const partitionKey = record.dynamodb?.Keys?.pk?.S;
		const sortKey = record.dynamodb?.Keys?.sk?.S;

		if (!partitionKey || !sortKey) continue;

		const newImage = record.dynamodb?.NewImage;
		if (!newImage) continue;

		console.log('Starting thumbnail transcoder for moment:', newImage.id.S);

		const objectKey = ContentPaths.relationshipMoments(newImage.relationshipId.S!, newImage.objectKey.S!);
		const videoObject = await storageBucket.getObject(objectKey);
		const videoBuffer = await videoObject.Body?.transformToByteArray();

		if (!videoBuffer) {
			console.warn('No video buffer for object key: ', objectKey);
			continue;
		}

		console.log('Received video buffer');

		// Store the file in the ephemeral storage on the lambda
		const videoPath = `/tmp/${newImage.objectKey.S!}`;
		await fs.writeFile(videoPath, videoBuffer);

		console.log('Saved video buffer to local file');

		const outputFile = `${newImage.objectKey.S!.split('.')[0]}.png`;
		const outputPath = path.join('/tmp', outputFile);

		const ffmpegParams = [
			'-ss',
			'1',
			'-i',
			videoPath,
			'-vf',
			'thumbnail,scale=1920:-1',
			'-vframes',
			'1',
			outputPath,
		];

		spawnSync(ffmpeg, ffmpegParams, { stdio: 'pipe' });

		console.log('Generated thumbnail');

		const thumbnail = await fs.readFile(outputPath);
		await storageBucket.uploadObject(
			ContentPaths.relationshipMoments(newImage.relationshipId.S!, outputFile),
			thumbnail,
		);

		console.log('Uploaded thumbnail to storage');

		await updateMomentDetails(newImage.id.S!, {
			thumbnailObjectKey: outputFile,
		});

		console.log('Updated moment details');
	}
};
