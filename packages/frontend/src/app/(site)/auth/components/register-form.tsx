'use client';

import { Button } from '@/components/ui/button';
import EasyForm from '@/components/ui/form-extras/easy-form';
import EasyFormField from '@/components/ui/form-extras/easy-form-field';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc/client';
import { handleTrpcError } from '@/lib/trpc/utils';
import { registerUserDto } from '@lumi/core/auth/auth.dto';
import { PASSWORD_REGEX } from '@lumi/core/users/users.dto';
import { signIn } from 'next-auth/react';
import { FC, useCallback, useState } from 'react';
import { SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const registerSchema = registerUserDto.and(
	z.object({
		confirmPassword: z.string().regex(PASSWORD_REGEX).optional(),
	}),
);

type RegisterSchema = z.infer<typeof registerSchema>;

const RegisterForm: FC = () => {
	const { mutateAsync: register, isPending: isRegistering } = RegisterUser();
	const [isAuthenticating, setIsAuthenticating] = useState(false);
	const onSubmit = useCallback<SubmitHandler<RegisterSchema>>(
		async ({ confirmPassword, ...data }) => {
			setIsAuthenticating(true);

			if (data.password !== confirmPassword)
				return toast.error('Passwords do not match');

			try {
				await register({
					...data,
					args: {
						sendOTP: true,
					},
				});
				toast.success('Account created successfully');
				await signIn('credentials', {
					username: data.username,
					password: data.password,
					redirectTo: '/',
				});
			} catch (e) {
				handleTrpcError(e);
			} finally {
				setIsAuthenticating(false);
			}
		},
		[],
	);

	return (
		<EasyForm
			schema={registerSchema}
			disabled={isAuthenticating || isRegistering}
			onSubmit={onSubmit}
			className="max-w-96 space-y-6"
		>
			<EasyFormField<RegisterSchema>
				name="username"
				label="Username"
				showErrorMessage
			>
				<Input />
			</EasyFormField>
			<EasyFormField<RegisterSchema>
				name="email"
				label="Email Address"
				showErrorMessage
			>
				<Input type="email" />
			</EasyFormField>
			<div className="flex gap-6">
				<EasyFormField<RegisterSchema>
					name="firstName"
					label="First Name"
					showErrorMessage
				>
					<Input />
				</EasyFormField>
				<EasyFormField<RegisterSchema>
					name="lastName"
					label="Last Name"
					showErrorMessage
				>
					<Input />
				</EasyFormField>
			</div>
			<EasyFormField<RegisterSchema>
				name="password"
				label="Password"
				showErrorMessage
			>
				<Input type="password" />
			</EasyFormField>
			<EasyFormField<RegisterSchema>
				name="confirmPassword"
				label="Confirm Password"
				showErrorMessage
			>
				<Input type="password" />
			</EasyFormField>
			<Button type="submit" disabled={isAuthenticating || isRegistering}>
				Login
			</Button>
		</EasyForm>
	);
};

const RegisterUser = () => {
	return trpc.auth.register.useMutation();
};

export default RegisterForm;
