'use client';

import type { FC } from 'react';
import { LogOutIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useSignOut } from '@/lib/hooks/useSignOut';

type Props = {
	iconOnly?: boolean;
	className?: string;
	disableNotification?: boolean;
	variant?: 'destructive' | 'destructive:flat';
};

const SignOutButton: FC<Props> = ({ iconOnly, className, disableNotification, variant }) => {
	const signOut = useSignOut({ disableNotification });

	return (
		<Button
			size={iconOnly ? 'icon' : undefined}
			className={className}
			variant={variant || 'destructive'}
			onClick={signOut}
			tooltip={iconOnly ? 'Sign Out' : undefined}
		>
			{iconOnly
				? (
						<LogOutIcon size={18} />
					)
				: (
						<>
							<LogOutIcon size={18} />
							Sign Out
						</>
					)}
		</Button>
	);
};

export default SignOutButton;
