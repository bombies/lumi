import { FC } from 'react';
import Link from 'next/link';
import { Moment } from '@lumi/core/types/moment.types';

import { Card, CardContent, CardTitle } from '@/components/ui/card';
import Image from '@/components/ui/image';
import { Skeleton } from '@/components/ui/skeleton';
import UserAvatar from '@/components/ui/user-avatar';
import { GetUserByIdSafe } from '@/hooks/trpc/user-hooks';
import { cn } from '@/lib/utils';

type Props = {
	moment: Moment;
	linkClassName?: string;
	className?: string;
	compactUploaderDisplay?: boolean;
};

const MomentCard: FC<Props> = ({ moment, linkClassName, className, compactUploaderDisplay }) => {
	const { data: uploader, isLoading: uploaderLoading } = GetUserByIdSafe(moment.userId);
	return (
		<Link className={linkClassName} href={`/moments/${moment.id}`}>
			<Card
				className={cn(
					'p-0 m-0 h-96 phone-big:h-[36rem] relative rounded-md border border-border overflow-hidden cursor-pointer',
					className,
				)}
			>
				<CardContent className="p-0 m-0 h-full w-full">
					<CardTitle hidden>{moment.title}</CardTitle>
					<Image src={moment.thumbnailUrl} alt={moment.title} className="h-full" fill objectFit="cover" />
					<div className="absolute bottom-0 w-full max-h-[45%] p-4 bg-foreground/50 backdrop-blur-md text-background space-y-2">
						<h6 className="text-xl font-bold line-clamp-2">{moment.title}</h6>
						{moment.description && <p className="line-clamp-2">{moment.description}</p>}

						<div className="flex gap-2">
							{!compactUploaderDisplay ? (
								<UserAvatar
									user={uploader}
									loading={uploaderLoading}
									hideStatus
									className="size-8 border-2 border-background"
								/>
							) : undefined}
							{uploaderLoading ? (
								<Skeleton className="w-20 h-4" />
							) : (
								<p className="font-medium">
									{uploader?.firstName}{' '}
									<span className="text-xs text-background/60">
										•{' '}
										{new Date(moment.createdAt).toLocaleDateString('en-US', {
											dateStyle: 'short',
										})}
									</span>
								</p>
							)}
						</div>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
};

export default MomentCard;
