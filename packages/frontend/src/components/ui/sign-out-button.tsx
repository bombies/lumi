'use client';

import { FC } from 'react';
import { LogOutIcon } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

type Props = {
	iconOnly?: boolean;
};

const SignOutButton: FC<Props> = ({ iconOnly }) => {
	return (
		<Button
			size={iconOnly ? 'icon' : undefined}
			variant="destructive"
			onClick={() =>
				toast.promise(signOut(), {
					loading: 'Signing out...',
					success: 'Signed out successfully.',
					error: 'Could not sign out.',
				})
			}
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
