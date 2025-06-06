'use client';

import type { FC } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import EasyForm from '@/components/ui/form-extras/easy-form';
import EasyFormInput from '@/components/ui/form-extras/fields/easy-form-input';
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
		async (data) => {
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
				onInteractOutside={(e) => {
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
					<EasyFormInput<ResetPasswordFormValues> type="password" name="oldPassword" label="Old Password" />
					<EasyFormInput<ResetPasswordFormValues> type="password" name="newPassword" label="New Password" />
					<EasyFormInput<ResetPasswordFormValues> type="password" name="confirmPassword" label="Confirm Password" />
					<Button type="submit" loading={isChangingPassword}>
						Change Password
					</Button>
				</EasyForm>
			</DialogContent>
		</Dialog>
	);
};

export default ResetPasswordButton;
