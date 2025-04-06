import { FC } from 'react';
import { notFound } from 'next/navigation';
import { getMomentDetailsById } from '@lumi/core/moments/moment.service';
import { getUserById } from '@lumi/core/users/users.service';

import Title from '@/components/ui/title';
import { getServerSession } from '@/lib/better-auth/auth-actions';
import { AsyncParams } from '@/lib/types';
import MomentEditForm from './components/moment-edit-form';

type Props = AsyncParams<{ id: string }>;

const MomentEditPage: FC<Props> = async ({ params }) => {
	const { id } = await params;
	const session = (await getServerSession())!;
	const user = await getUserById(session.user.id);
	const moment = await getMomentDetailsById(id, { safeReturn: true });
	if (!user || !moment || moment.relationshipId !== user.relationshipId) notFound();

	return (
		<>
			<Title>Edit Moment</Title>
			<MomentEditForm moment={moment} />
		</>
	);
};

export default MomentEditPage;
