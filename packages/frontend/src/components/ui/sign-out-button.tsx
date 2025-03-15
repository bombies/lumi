'use client';

import { FC } from 'react';
import { LogOutIcon } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { sendSignOutNotification } from '@/lib/actions/relationship-actions';

type Props = {
	iconOnly?: boolean;
};

const SignOutButton: FC<Props> = ({ iconOnly }) => {
	const { data: session } = useSession();

	return (
		<Button
			size={iconOnly ? 'icon' : undefined}
			variant="destructive"
			onClick={async () => {
				if (!session) return;
				const user = session.user;
				await sendSignOutNotification(user.id!, user.username!);

				toast.promise(signOut(), {
					loading: 'Signing out...',
					async success() {
						return 'Signed out successfully.';
					},
					error: 'Could not sign out.',
				});
			}}
			tooltip={iconOnly ? 'Sign Out' : undefined}
		>
			{iconOnly ? (
				<LogOutIcon size={18} />
			) : (
				<>
					<LogOutIcon size={18} />
					Sign Out
				</>
			)}
		</Button>
	);
};

export default SignOutButton;
