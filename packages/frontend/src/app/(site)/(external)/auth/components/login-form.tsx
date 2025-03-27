'use client';

import { FC, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import EasyForm from '@/components/ui/form-extras/easy-form';
import EasyFormField from '@/components/ui/form-extras/easy-form-field';
import { Input } from '@/components/ui/input';
import PasswordInput from '@/components/ui/password-input';
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

			let data: any | null | undefined;
			let error: any | null | undefined;
			if (usernameOrEmail.includes('@')) {
				const { data: _data, error: _error } = await auth.signIn.email({
					email: usernameOrEmail,
					password,
					callbackURL: '/home',
				});
				data = _data;
				error = _error;
			} else {
				const { data: _data, error: _error } = await auth.signIn.username({
					username: usernameOrEmail,
					password,
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				data = _data;
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
			<EasyFormField<LoginSchema> name="usernameOrEmail" label="Username or Email" showErrorMessage>
				<Input />
			</EasyFormField>
			<EasyFormField<LoginSchema> name="password" label="Password" showErrorMessage>
				<PasswordInput />
			</EasyFormField>
			<Link href="/auth/register" className="block text-xs">
				Don't have an account? <span className="text-secondary dark:text-accent">Create an account</span>
			</Link>
			<Button type="submit" loading={isAuthenticating}>
				Login
			</Button>
		</EasyForm>
	);
};

export default LoginForm;
