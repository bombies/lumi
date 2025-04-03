'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BackwardIcon, HomeIcon } from '@heroicons/react/24/solid';

import { Button } from '@/components/ui/button';

export default function NotFound() {
	const router = useRouter();
	return (
		<main className="flex flex-col justify-center items-center h-screen">
			<h1 className="font-black text-primary text-9xl">404</h1>
			<h2 className="font-cursive text-5xl">Page Not Found</h2>
			<div className="flex gap-2 mt-6 p-6 border border-primary border-dashed bg-primary/20 rounded-md">
				<Link href="/home">
					<Button>
						<HomeIcon /> Go Home
					</Button>
				</Link>
				<Button onClick={() => router.back()}>
					<BackwardIcon /> Go Back
				</Button>
			</div>
		</main>
	);
}
