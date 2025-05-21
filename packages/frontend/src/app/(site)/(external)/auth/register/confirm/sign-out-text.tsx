'use client';

import type { FC } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { auth } from '@/lib/better-auth/auth-client';

const SignOutText: FC = () => {
	const { data: session } = auth.useSession();
	const router = useRouter();

	return (
		<button
			onClick={async () => {
				if (!session) return;
				toast.promise(auth.signOut(), {
					loading: 'Signing out...',
					async success() {
						localStorage.removeItem('auth-jwt');
						router.push('/auth/login');
						return 'Signed out successfully.';
					},
					error: 'Could not sign out.',
				});
			}}
			className="text-primary underline cursor-pointer"
		>
			Sign out
		</button>
	);
};

export default SignOutText;
