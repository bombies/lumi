'use client';

import { FC, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import EasyForm from '@/components/ui/form-extras/easy-form';
import EasyFormField from '@/components/ui/form-extras/easy-form-field';
import { Input } from '@/components/ui/input';
import PasswordInput from '@/components/ui/password-input';
import { Separator } from '@/components/ui/separator';

const loginSchema = z.object({
	usernameOrEmail: z.string().nonempty(),
	password: z.string().nonempty(),
});

type LoginSchema = z.infer<typeof loginSchema>;

const LoginForm: FC = () => {
	const router = useRouter();
	const [isAuthenticating, setIsAuthenticating] = useState(false);
	const onSubmit = useCallback<SubmitHandler<LoginSchema>>(
		({ usernameOrEmail, password }) => {
			setIsAuthenticating(true);

			signIn('credentials', {
				username: usernameOrEmail,
				password,
				redirect: false,
			})
				.then(cb => {
					console.log(cb?.error);
					if (cb?.error) toast.error('Invalid credentials! Please check your details and try again.');
					else if (cb?.ok) {
						toast.success('Logged in!');
						router.push('/');
					}
				})
				.finally(() => {
					setIsAuthenticating(false);
				});
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
