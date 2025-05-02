import { Button } from '@/components/ui/button';
import { getServerSession } from '@/lib/better-auth/auth-actions';
import { ArrowRight } from 'lucide-react';

import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function Home() {
	const session = await getServerSession();
	if (session) {
		if (session.user.emailVerified) redirect('/home');
		else redirect('/auth/register/confirm');
	}

	return (
		<main className="flex flex-col justify-center items-center h-screen gap-y-4">
			<p>hey! welcome to</p>
			<h1 className="font-cursive text-8xl">Lumi.</h1>
			<Link href="/auth/login">
				<Button>
					<ArrowRight size={18} />
					{' '}
					let's go
				</Button>
			</Link>
		</main>
	);
}
