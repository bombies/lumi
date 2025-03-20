import { FC } from 'react';
import { notFound } from 'next/navigation';
import { getMomentDetailsById } from '@lumi/core/moments/moment.service';
import { getUserById } from '@lumi/core/users/users.service';
import Player from 'next-video/player';
import MediaThemeInstaplay from 'player.style/instaplay/react';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AsyncParams } from '@/lib/types';

type Props = AsyncParams<{ id: string }>;

const MomentViewerPage: FC<Props> = async ({ params }) => {
	const { id } = await params;
	const supabase = await createSupabaseServerClient();
	const user = await getUserById((await supabase.auth.getUser()).data.user!.id);
	const moment = await getMomentDetailsById(id, { safeReturn: true });
	if (!user || !moment || moment.relationshipId !== user.relationshipId) notFound();

	return (
		<>
			<div className="w-screen flex justify-center">
				<div className="h-[calc(100vh-60px-70.4px)] max-w-[496px] aspect-[9/16] mx-auto phone-big:mx-0 shrink-0">
					<Player src={moment.videoUrl} className="aspect-[9/16]" autoPlay theme={MediaThemeInstaplay} loop />
				</div>
			</div>
		</>
	);
};

export default MomentViewerPage;
