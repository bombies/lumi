import type { DynamoDBStreamEvent, Handler } from 'aws-lambda';
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { updateMomentDetails } from '@lumi/core/moments/moment.service';
import { ContentPaths, StorageClient } from '@lumi/core/utils/s3/s3.service';
import ffmpeg from 'ffmpeg-static';
import { Resource } from 'sst';

const storageBucket = new StorageClient(Resource.ContentBucket.name);

export const handler: Handler<DynamoDBStreamEvent> = async (event) => {
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

		try {
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

			console.log('Initializing ffmpeg params...');

			const ffmpegParams = ['-i', videoPath, '-frames:v', '1', outputPath];

			console.log('Starting ffmpeg processing... ffmpeg path: ', ffmpeg);
			const spawnResult = spawnSync(ffmpeg, ffmpegParams, { stdio: 'inherit' });

			if (spawnResult.error) {
				console.error('Error spawning ffmpeg: ', spawnResult.error);
				continue;
			} else if (spawnResult.stderr) {
				console.error('FFmpeg error: ', spawnResult.stderr.toString());
				continue;
			}

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
		} catch (e) {
			console.error('Error in transcoder: ', e);
		}
	}
};
