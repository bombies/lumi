'use client';

import { FC } from 'react';
import { NoSymbolIcon, UserMinusIcon } from '@heroicons/react/24/solid';
import { toast } from 'sonner';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { GetSelfUser } from '@/hooks/trpc/user-hooks';
import { auth } from '@/lib/better-auth/auth-client';
import { useSignOut } from '@/lib/hooks/useSignOut';

const DeleteAccountButton: FC = () => {
	const { data: self } = GetSelfUser();

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="destructive" disabled={!self}>
					<UserMinusIcon className="size-[18px]" /> Delete Account
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Account</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete your account? This will delete <b>ALL</b> data related to your
						account. This includes your relationship, affirmations, moments and music recommendations. Of
						course, your account information will be deleted as well.
						<br />
						<br />
						Deleting your account is permanent and cannot be reversed. If you are in a relationship, it will
						be deleted and your partner will no longer be in a relationship.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogAction
						className="bg-destructive hover:bg-destructive/80"
						onClick={() => {
							toast.promise(
								auth.deleteUser({
									callbackURL: `/auth/delete-account?user_id=${self!.id}`,
								}),
								{
									loading: 'Send account deletion verification email...',
									async success() {
										return 'You have been sent an account deletion verification email.';
									},
									error: 'There was an error sending the verification email.',
								},
							);
						}}
					>
						<UserMinusIcon className="size-[18px]" /> Delete Account
					</AlertDialogAction>
					<AlertDialogCancel>
						<NoSymbolIcon className="size-[18px]" /> Cancel
					</AlertDialogCancel>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default DeleteAccountButton;
