'use client';

import type { FC } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import EasyForm from '@/components/ui/form-extras/easy-form';
import EasyFormInput from '@/components/ui/form-extras/fields/easy-form-input';

import { Separator } from '@/components/ui/separator';
import { auth } from '@/lib/better-auth/auth-client';
import { registerUserDto } from '@lumi/core/auth/auth.dto';
import { PASSWORD_REGEX } from '@lumi/core/users/users.dto';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { register } from '../actions';

const registerSchema = registerUserDto.and(
	z.object({
		confirmPassword: z.string().regex(PASSWORD_REGEX).optional(),
	}),
);

type RegisterSchema = z.infer<typeof registerSchema>;

/**
 * This is the array of emails allowed to register on the app. For now, it's just me and Sarah <3
 */
const permittedEmails = ['ajani.green@outlook.com', 'juzsarahx@gmail.com'];

const RegisterForm: FC = () => {
	const [isAuthenticating, setIsAuthenticating] = useState(false);
	const onSubmit = useCallback<SubmitHandler<RegisterSchema>>(async ({ confirmPassword, ...data }) => {
		if (process.env.NEXT_PUBLIC_APP_STAGE === 'production' && !permittedEmails.includes(data.email.toLowerCase()))
			return toast.error('You aren\'t permitted to register!');

		setIsAuthenticating(true);

		if (data.password !== confirmPassword) {
			toast.error('Passwords do not match');
			return setIsAuthenticating(false);
		}

		const { data: _data, error } = await auth.signUp.email({
			email: data.email,
			password: data.password,
			username: data.username,
			name: `${data.firstName} ${data.lastName}`,
			callbackURL: '/join',
		});

		if (error) {
			toast.error(error.message);
		} else {
			await register(_data.user, data);
		}

		setIsAuthenticating(false);

		return () => {
			setIsAuthenticating(false);
		};
	}, []);

	return (
		<EasyForm
			schema={registerSchema}
			disabled={isAuthenticating}
			onSubmit={onSubmit}
			className="w-full max-w-[35rem] space-y-6 bg-card p-6 rounded-lg border border-border"
		>
			<h3 className="text-center font-cursive text-4xl mb-2">Register</h3>
			<Separator className="mb-9" />
			<EasyFormInput<RegisterSchema> name="username" label="Username" showErrorMessage />
			<EasyFormInput<RegisterSchema> name="email" label="Email Address" showErrorMessage />
			<EasyFormInput<RegisterSchema> name="firstName" label="First Name" showErrorMessage />
			<EasyFormInput<RegisterSchema> name="lastName" label="Last Name" showErrorMessage />
			<EasyFormInput<RegisterSchema>
				type="password"
				name="password"
				label="Password"
				showErrorMessage
			/>
			<EasyFormInput<RegisterSchema>
				type="password"
				name="confirmPassword"
				label="Confirm Password"
				showErrorMessage
			/>
			<Button type="submit" loading={isAuthenticating}>
				Register
			</Button>
		</EasyForm>
	);
};

export default RegisterForm;
