'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

const SignInButton = () => {
	return (
		<Link href="/auth/login">
			<Button>Sign In</Button>
		</Link>
	);
};

export default SignInButton;
