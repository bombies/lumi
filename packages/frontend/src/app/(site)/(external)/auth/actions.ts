'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { RegisterUserDto } from '@lumi/core/auth/auth.dto';
import { AdditionalSupabaseUserMetaData } from '@lumi/core/types/auth.types';
import { createUser, getUserByUsername } from '@lumi/core/users/users.service';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export const login = async (usernameOrEmail: string, password: string) => {
	const supabase = await createSupabaseServerClient();

	let email = usernameOrEmail.includes('@') ? usernameOrEmail : null;
	if (!email) {
		// Try fetching the user by username
		const user = await getUserByUsername(usernameOrEmail);
		if (!user) throw new Error('User not found!');

		email = user.email;
	}

	const { error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) throw error;

	revalidatePath('/', 'layout');
	redirect('/');
};

export const register = async ({ password, ...dto }: RegisterUserDto) => {
	const supabase = await createSupabaseServerClient();

	const existingUser = await getUserByUsername(dto.username);
	if (existingUser) redirect('/auth/register?error=UsernameAlreadyExists');

	const { data: signUpResponse, error } = await supabase.auth.signUp({
		email: dto.email,
		password,
		options: {
			data: { username: dto.username } satisfies AdditionalSupabaseUserMetaData,
		},
	});

	if (error) redirect(`/auth/register?error=${encodeURIComponent(error.message)}`);

	if (!signUpResponse.user) throw new Error('User null');

	try {
		await createUser({
			id: signUpResponse.user.id,
			...dto,
		});
	} catch (e) {
		console.error(e);
		redirect('/auth/register?error=InternalServerError');
	}

	revalidatePath('/auth/register/confirm', 'layout');
	redirect('/auth/register/confirm');
};
