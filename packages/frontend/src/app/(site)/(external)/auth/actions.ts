'use server';

import type { RegisterUserDto } from '@lumi/core/auth/auth.dto';
import type { User as BetterAuthUser } from 'better-auth';
import { createUser } from '@lumi/core/users/users.service';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export const register = async (user: BetterAuthUser, dto: RegisterUserDto) => {
	try {
		await createUser({
			id: user.id,
			...dto,
		});
	} catch (e) {
		console.error(e);
		redirect('/auth/register?error=InternalServerError');
	}

	revalidatePath('/auth/register/confirm', 'layout');
	redirect('/auth/register/confirm');
};
