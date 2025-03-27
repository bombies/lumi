import { FC } from 'react';
import { notFound } from 'next/navigation';
import { getMomentDetailsById } from '@lumi/core/moments/moment.service';
import { getUserById } from '@lumi/core/users/users.service';
import Player from 'next-video/player';
import MediaThemeInstaplay from 'player.style/instaplay/react';

import { getServerSession } from '@/lib/better-auth/auth-actions';
import { AsyncParams } from '@/lib/types';
import MomentDetailsContainer from './components/moment-details-container';

type Props = AsyncParams<{ id: string }>;

const MomentViewerPage: FC<Props> = async ({ params }) => {
	const { id } = await params;
	const session = (await getServerSession())!;
	const user = await getUserById(session.user.id);
	const moment = await getMomentDetailsById(id, { safeReturn: true });
	if (!user || !moment || moment.relationshipId !== user.relationshipId) notFound();
	const uploader = await getUserById(moment.userId);

	return (
		<>
			<div className="w-screen flex justify-center">
				<div className="h-[calc(100vh-60px-70.4px)] mt-[61px] laptop:mt-0 max-w-screen phone-big:max-w-[496px] aspect-[9/16] mx-auto phone-big:mx-0 shrink-0 relative">
					<Player
						src={moment.videoUrl}
						className="aspect-[9/16] h-[calc(100vh-60px-70.4px)]"
						autoPlay
						theme={MediaThemeInstaplay}
						autoFocus={false}
						loop
						playsInline
					/>
					<MomentDetailsContainer moment={moment} uploader={uploader} currentUser={user} />
				</div>
			</div>
		</>
	);
};

export default MomentViewerPage;
