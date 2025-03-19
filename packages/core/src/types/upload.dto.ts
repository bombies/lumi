import { z } from 'zod';

export const getUploadUrlDto = z.object({
	objectKey: z.string(),
	fileExtension: z.string(),
});
