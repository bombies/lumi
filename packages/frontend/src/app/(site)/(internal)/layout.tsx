import { FC, PropsWithChildren } from 'react';
import { redirect } from 'next/navigation';
import { Resource } from 'sst';

import RelationshipProvider from '@/components/providers/relationships/relationship-provder';
import NotificationWatcher from '@/components/providers/web-sockets/notification-watcher';
import { PresenceWatcher } from '@/components/providers/web-sockets/presence-watcher';
import WebSocketProvider from '@/components/providers/web-sockets/web-socket-provider';
import { requireRelationship } from '@/lib/actions/requireRelationship';

const InternalLayout: FC<PropsWithChildren> = async ({ children }) => {
	const { partner, self: user, ...relationship } = await requireRelationship({ withPartner: true, withSelf: true });
	if (!user) redirect('/auth/login');

	return (
		<WebSocketProvider
			endpoint={Resource.RealtimeServer.endpoint}
			authorizer={Resource.RealtimeServer.authorizer}
			relationshipId={relationship.id}
			user={user}
		>
			<RelationshipProvider relationship={relationship} self={user} partner={partner!}>
				<PresenceWatcher user={user} relationship={relationship} />
				<NotificationWatcher />
				{children}
			</RelationshipProvider>
		</WebSocketProvider>
	);
};

export default InternalLayout;
