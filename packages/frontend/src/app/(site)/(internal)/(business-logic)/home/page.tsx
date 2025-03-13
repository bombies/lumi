import { FC } from 'react';
import { redirect } from 'next/navigation';
import { getUserById } from '@lumi/core/users/users.service';

import NotificationsTest from '@/components/notifications/notifications-test';
import RelationshipProvider from '@/components/providers/relationships/relationship-provder';
import WebSocketTest from '@/components/providers/web-sockets/tests/web-socket-test';
import { requireRelationship } from '@/lib/actions/requireRelationship';
import { getUserBySession } from '@/lib/server-utils';

const HomePage: FC = async () => {
	const relationship = await requireRelationship();

	const user = await getUserBySession();
	if (!user) redirect('/auth/login');

	const partnerId = relationship.partner1 === user.id ? relationship.partner2 : relationship.partner1;
	const partner = await getUserById(partnerId);

	return (
		<RelationshipProvider relationship={relationship} partner={partner!}>
			<main className="px-6">
				<h1 className="font-bold text-5xl mt-18">
					hey <span className="text-primary">{user.firstName}</span>
				</h1>
				<h3 className="text-2xl font-light max-w-[60vw] tablet:max-w-xs">
					welcome back to your space with <span className="text-primary font-bold">{partner?.firstName}</span>
				</h3>
				<NotificationsTest />
				<WebSocketTest />
			</main>
		</RelationshipProvider>
	);
};

export default HomePage;
