import { FC } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import SendRelationshipRequestContent from '@/app/(site)/(external)/join/components/send-relationship-request-content';
import { auth } from '@/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const JoinPage: FC = async () => {
	const session = (await auth())!;

	if (session.user.relationshipId) redirect('/home');

	return (
		<main className="p-12">
			<Link href="/">
				<h1 className="font-cursive text-2xl mb-6">Lumi.</h1>
			</Link>
			<section className="space-y-3">
				<h1 className="text-5xl font-bold">
					Join a <span className="text-primary">space</span>
				</h1>
				<p className="max-w-sm">
					Before you can start using Lumi, you must join a space. You can either send a request to a user or
					accept a current invitation.
				</p>
				<Tabs defaultValue="send" className="w-full phone-big:w-96">
					<TabsList>
						<TabsTrigger value="send">Send Request</TabsTrigger>
						<TabsTrigger value="received">Received Requests</TabsTrigger>
						<TabsTrigger value="sent">Sent Requests</TabsTrigger>
					</TabsList>
					<TabsContent value="send">
						<SendRelationshipRequestContent />
					</TabsContent>
					<TabsContent value="received">:3</TabsContent>
					<TabsContent value="sent">3:</TabsContent>
				</Tabs>
			</section>
		</main>
	);
};

export default JoinPage;
