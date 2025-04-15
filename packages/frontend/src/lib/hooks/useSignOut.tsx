'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { sendSignOutNotification } from '../actions/relationship-actions';
import { auth } from '../better-auth/auth-client';

type UseSignOutArgs = {
	disableNotification?: boolean;
};

export const useSignOut = (args?: UseSignOutArgs) => {
	const { data: session } = auth.useSession();
	const router = useRouter();

	const signOut = useCallback(async () => {
		if (!session) return;
		const user = session.user;
		if (!args?.disableNotification) await sendSignOutNotification(user.id, user.name);

		toast.promise(auth.signOut(), {
			loading: 'Signing out...',
			async success() {
				localStorage.removeItem('auth-jwt');
				router.push('/auth/login');
				return 'Signed out successfully.';
			},
			error: 'Could not sign out.',
		});
	}, [args?.disableNotification, router, session]);

	return signOut;
};
