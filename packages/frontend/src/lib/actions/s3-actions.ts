'use server';

import { StorageClient } from '@lumi/core/utils/s3/s3.service';
import { Resource } from 'sst';

const storageBucket = new StorageClient(Resource.ContentBucket.name);

export const deleteS3Object = async (key: string) => {
	return storageBucket.deleteObject(key);
};
