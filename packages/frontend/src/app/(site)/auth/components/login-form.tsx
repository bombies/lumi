'use client';

import { Button } from '@/components/ui/button';
import EasyForm from '@/components/ui/form-extras/easy-form';
import EasyFormField from '@/components/ui/form-extras/easy-form-field';
import { Input } from '@/components/ui/input';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useState } from 'react';
import { SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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
					if (cb?.error)
						toast.error(
							'Invalid credentials! Please check your details and try again.',
						);
					else if (cb?.ok) {
						toast.success('Logged in!');
						router.push('/');
					}
				})
				.finally(() => {
					setIsAuthenticating(false);
				});
		},
		[],
	);

	return (
		<EasyForm
			schema={loginSchema}
			disabled={isAuthenticating}
			onSubmit={onSubmit}
			className="max-w-96 space-y-6"
		>
			<EasyFormField<LoginSchema> name="usernameOrEmail" label="Username or Email">
				<Input />
			</EasyFormField>
			<EasyFormField<LoginSchema> name="password" label="Password">
				<Input type="password" />
			</EasyFormField>
			<Button type="submit">Login</Button>
		</EasyForm>
	);
};

export default LoginForm;
