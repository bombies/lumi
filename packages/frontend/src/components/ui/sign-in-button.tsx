'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';

const SignInButton = () => {
	return (
		<Link href="/auth/login">
			<Button>Sign In</Button>
		</Link>
	);
};

export default SignInButton;
