'use client';

import { FC } from 'react';
import { useRouter } from 'next/navigation';
import { LogOutIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { sendSignOutNotification } from '@/lib/actions/relationship-actions';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSession } from '../providers/session-provider';

type Props = {
	iconOnly?: boolean;
	className?: string;
	disableNotification?: boolean;
	variant?: 'destructive' | 'destructive:flat';
};

const SignOutButton: FC<Props> = ({ iconOnly, className, disableNotification, variant }) => {
	const { data: session } = useSession();
	const router = useRouter();
	const supabase = createSupabaseBrowserClient();

	return (
		<Button
			size={iconOnly ? 'icon' : undefined}
			className={className}
			variant={variant || 'destructive'}
			onClick={async () => {
				if (!session) return;
				const user = session.user!;
				if (!disableNotification) await sendSignOutNotification(user.id, user.user_metadata.username);

				toast.promise(supabase.auth.signOut(), {
					loading: 'Signing out...',
					async success() {
						router.push('/auth/login');
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
