import { createSubjects } from '@openauthjs/openauth/subject';
import { z } from 'zod';

const userSubjectSchema = z.object({
	id: z.string(),
	username: z.string(),
	email: z.string().email(),
});

export const subjects = createSubjects({
	user: userSubjectSchema,
});

export type UserSubject = z.infer<typeof userSubjectSchema>;
