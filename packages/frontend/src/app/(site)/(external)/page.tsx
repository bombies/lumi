import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

import { auth } from '@/auth';
import { Button } from '@/components/ui/button';

export default async function Home() {
	const session = await auth();
	if (session) redirect('/home');

	return (
		<main className="flex flex-col justify-center items-center h-screen gap-y-4">
			<p>hey! welcome to</p>
			<h1 className="font-cursive text-8xl">Lumi.</h1>
			<Link href="/auth/login">
				<Button>
					<ArrowRight size={18} /> let's go
				</Button>
			</Link>
		</main>
	);
}
