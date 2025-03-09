'use client';

import { signOut } from 'next-auth/react';

import { Button } from '@/components/ui/button';

const SignOutButton = () => {
	return <Button onClick={() => signOut()}>Sign Out</Button>;
};

export default SignOutButton;
