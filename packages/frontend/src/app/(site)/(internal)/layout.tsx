import { FC, PropsWithChildren } from 'react';
import { redirect } from 'next/navigation';
import { getRelationshipForUser } from '@lumi/core/relationships/relationship.service';
import { Resource } from 'sst';

import WebSocketProvider from '@/components/providers/web-sockets/web-socket-provider';
import { getUserBySession } from '@/lib/server-utils';

const InternalLayout: FC<PropsWithChildren> = async ({ children }) => {
	const user = await getUserBySession();
	if (!user) redirect('/auth/login');

	const relationship = await getRelationshipForUser(user.id);
	return (
		<WebSocketProvider
			endpoint={Resource.RealtimeServer.endpoint}
			authorizer={Resource.RealtimeServer.authorizer}
			relationshipId={relationship?.id}
		>
			{children}
		</WebSocketProvider>
	);
};

export default InternalLayout;
