'use server';

import { getMomentUploadUrl } from '@lumi/core/moments/moment.service';

export const fetchMomentUploadUrl = async (relationshipId: string, objectKey: string, fileExtension: string) => {
	return getMomentUploadUrl(relationshipId, { objectKey, fileExtension });
};
