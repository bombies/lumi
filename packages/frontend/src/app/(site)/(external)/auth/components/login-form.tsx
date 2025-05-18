'use client';

import type { FC } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import EasyForm from '@/components/ui/form-extras/easy-form';
import EasyFormInput from '@/components/ui/form-extras/fields/easy-form-input';
import { Separator } from '@/components/ui/separator';
import { auth } from '@/lib/better-auth/auth-client';

const loginSchema = z.object({
	usernameOrEmail: z.string().nonempty(),
	password: z.string().nonempty(),
});

type LoginSchema = z.infer<typeof loginSchema>;

const LoginForm: FC = () => {
	const router = useRouter();
	const [isAuthenticating, setIsAuthenticating] = useState(false);
	const onSubmit = useCallback<SubmitHandler<LoginSchema>>(
		async ({ usernameOrEmail, password }) => {
			setIsAuthenticating(true);

			let error: any | null | undefined;
			if (usernameOrEmail.includes('@')) {
				const { error: _error } = await auth.signIn.email({
					email: usernameOrEmail,
					password,
					callbackURL: '/home',
				});
				error = _error;
			} else {
				const { error: _error } = await auth.signIn.username({
					username: usernameOrEmail,
					password,
				});
				error = _error;
			}

			if (error) {
				toast.error(error.message);
			} else {
				toast.success('Logged in successfully!');
				if (!usernameOrEmail.includes('@')) router.push('/home');
			}

			setIsAuthenticating(false);

			return () => {
				setIsAuthenticating(false);
			};
		},
		[router],
	);

	return (
		<EasyForm
			schema={loginSchema}
			disabled={isAuthenticating}
			onSubmit={onSubmit}
			className="w-full max-w-[35rem] space-y-6 bg-card p-6 rounded-lg border border-border"
		>
			<h3 className="text-center font-cursive text-4xl mb-2">Login</h3>
			<Separator className="mb-9" />
			<EasyFormInput<LoginSchema> name="usernameOrEmail" label="Username or Email" showErrorMessage />
			<EasyFormInput<LoginSchema>
				type="password"
				name="password"
				label="Password"
				showErrorMessage
			/>
			<Link href="/auth/register" className="block text-xs">
				Don't have an account?
				{' '}
				<span className="text-secondary dark:text-accent">Create an account</span>
			</Link>
			<Button type="submit" loading={isAuthenticating}>
				Login
			</Button>
		</EasyForm>
	);
};

export default LoginForm;
