'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { RegisterUserDto } from '@lumi/core/auth/auth.dto';
import { createUser } from '@lumi/core/users/users.service';
import { User as BetterAuthUser } from 'better-auth';

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
