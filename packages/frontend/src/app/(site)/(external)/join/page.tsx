import type { FC } from 'react';
import ReceivedRelationshipRequestsContent from '@/app/(site)/(external)/join/components/received-relationship-requests-content';
import SendRelationshipRequestContent from '@/app/(site)/(external)/join/components/send-relationship-request-content';
import SignOutButton from '@/components/ui/sign-out-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { getServerSession } from '@/lib/better-auth/auth-actions';
import { EnvelopeIcon, InboxArrowDownIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { getRelationshipForUser } from '@lumi/core/relationships/relationship.service';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import SentRelationshipRequestsContainer from './components/sent-relationship-requests.container';

const JoinPage: FC = async () => {
	const session = (await getServerSession())!;
	if (!session.user.emailVerified) redirect('/auth/register/confirm');

	const relationship = await getRelationshipForUser(session.user.id);
	if (relationship) redirect('/home');

	return (
		<main className="p-12 space-y-6">
			<Link href="/">
				<h1 className="font-cursive text-2xl mb-6">Lumi.</h1>
			</Link>
			<section className="space-y-3">
				<h1 className="text-5xl font-bold">
					Join a
					{' '}
					<span className="text-primary">space</span>
				</h1>
				<p className="max-w-sm">
					Before you can start using Lumi, you must join a space. You can either send a request to a user or
					accept a current invitation.
				</p>
				<Tabs defaultValue="send" className="w-full phone-big:w-96">
					<TabsList>
						<TabsTrigger value="send">
							<PaperAirplaneIcon className="size-[18px]" />
							{' '}
							Send
						</TabsTrigger>
						<TabsTrigger value="received">
							<InboxArrowDownIcon className="size-[18px]" />
							{' '}
							Received
						</TabsTrigger>
						<TabsTrigger value="sent">
							<EnvelopeIcon className="size-[18px]" />
							Sent
						</TabsTrigger>
					</TabsList>
					<TabsContent value="send">
						<SendRelationshipRequestContent />
					</TabsContent>
					<TabsContent value="received">
						<ReceivedRelationshipRequestsContent />
					</TabsContent>
					<TabsContent value="sent">
						<SentRelationshipRequestsContainer />
					</TabsContent>
				</Tabs>
			</section>
			<SignOutButton variant="destructive:flat" disableNotification />
		</main>
	);
};

export default JoinPage;
