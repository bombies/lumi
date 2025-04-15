'use client';

import { FC, useCallback, useState } from 'react';
import { SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import EasyForm from '@/components/ui/form-extras/easy-form';
import EasyFormField from '@/components/ui/form-extras/easy-form-field';
import PasswordInput from '@/components/ui/password-input';
import { auth } from '@/lib/better-auth/auth-client';

const resetPasswordFormSchema = z.object({
	oldPassword: z.string().min(1, 'Old password is required'),
	newPassword: z.string().min(1, 'New password is required'),
	confirmPassword: z.string().min(1, 'Confirm password is required'),
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;

const ResetPasswordButton: FC = () => {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [isChangingPassword, setIsChangingPassword] = useState(false);
	const onSubmit = useCallback<SubmitHandler<ResetPasswordFormValues>>(
		async data => {
			if (isChangingPassword) return;
			if (data.newPassword !== data.confirmPassword) toast.error('Passwords do not match!');

			setIsChangingPassword(true);
			const changeResponse = await auth.changePassword({
				currentPassword: data.oldPassword,
				newPassword: data.newPassword,
				revokeOtherSessions: true,
			});

			if (changeResponse.error) {
				toast.error(changeResponse.error.message);
			} else {
				toast.success(
					'Password changed successfully! If you are signed in on other devices, you will be logged out.',
				);
				setDialogOpen(false);
			}

			setIsChangingPassword(false);
		},
		[isChangingPassword],
	);

	return (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
			<DialogTrigger asChild>
				<Button size="sm">Change Password</Button>
			</DialogTrigger>
			<DialogContent
				onInteractOutside={e => {
					e.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>Reset Password</DialogTitle>
				</DialogHeader>
				<EasyForm
					schema={resetPasswordFormSchema}
					submitting={isChangingPassword}
					onSubmit={onSubmit}
					clearOnSubmit
					className="space-y-6"
				>
					<EasyFormField<ResetPasswordFormValues> name="oldPassword" label="Old Password">
						<PasswordInput />
					</EasyFormField>
					<EasyFormField<ResetPasswordFormValues> name="newPassword" label="New Password">
						<PasswordInput />
					</EasyFormField>
					<EasyFormField<ResetPasswordFormValues> name="confirmPassword" label="Confirm Password">
						<PasswordInput />
					</EasyFormField>
					<Button type="submit" loading={isChangingPassword}>
						Change Password
					</Button>
				</EasyForm>
			</DialogContent>
		</Dialog>
	);
};

export default ResetPasswordButton;
