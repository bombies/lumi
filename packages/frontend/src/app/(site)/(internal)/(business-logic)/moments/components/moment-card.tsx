import type { Moment } from '@lumi/core/moments/moment.types';
import type { FC } from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';

import Image from '@/components/ui/image';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import UserAvatar from '@/components/ui/user-avatar';
import { GetMomentTags } from '@/hooks/trpc/moment-hooks';
import { GetUserByIdSafe } from '@/hooks/trpc/user-hooks';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type Props = {
	moment: Moment;
	linkClassName?: string;
	className?: string;
	compactUploaderDisplay?: boolean;
};

const MomentCard: FC<Props> = ({ moment, linkClassName, className, compactUploaderDisplay }) => {
	const { data: momentTags } = GetMomentTags(moment.id);
	const { data: uploader, isLoading: uploaderLoading } = GetUserByIdSafe(moment.userId);
	return (
		<Link className={linkClassName} href={`/moments/${moment.id}`}>
			<Card
				className={cn(
					'p-0 m-0 h-96  relative rounded-md border border-border overflow-hidden cursor-pointer',
					className,
				)}
			>
				<CardContent className="p-0 m-0 h-full w-full flex flex-col">
					<CardTitle hidden>{moment.title}</CardTitle>
					<Image
						src={moment.thumbnailUrl}
						fallbackSrc="/fallback/thumbnail.png"
						alt={moment.title}
						className=" bg-black h-1/2 flex items-center justify-center shrink-0"
						width={1080}
						height={1920}
						style={{
							width: 'auto',
							height: '100%',
						}}
						sizes="100%"
						objectFit="contain"
					/>
					<div className="w-full flex grow flex-col p-4 text-foreground justify-between gap-2">
						<div className="space-y-2">
							{momentTags?.length
								? (
										<div className="hidden tablet:block space-y-2">
											<div className="flex flex-wrap gap-1">
												{momentTags.map(tag => (
													<span
														className="text-[10px] tablet:text-xs px-2 py-1 rounded-sm bg-foreground text-background"
														key={`${moment.id}#${tag.tag}`}
													>
														{`#${tag.tag}`}
													</span>
												))}
											</div>
											<Separator className="my-1" />
										</div>
									)
								: undefined}
							<h6 className="text-lg tablet:text-xl font-bold line-clamp-2">{moment.title}</h6>
							{moment.description && (
								<p className={cn('line-clamp-2', momentTags?.length && 'tablet:line-clamp-1')}>
									{moment.description}
								</p>
							)}
						</div>

						<div className="flex gap-2">
							{!compactUploaderDisplay
								? (
										<UserAvatar
											user={uploader}
											loading={uploaderLoading}
											hideStatus
											className="size-8 border-2 border-background"
										/>
									)
								: undefined}
							{uploaderLoading
								? (
										<Skeleton className="w-20 h-4" />
									)
								: (
										<p className="font-medium">
											{uploader?.firstName}
											{' '}
											<span className="text-xs text-foreground/40">
												•
												{' '}
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
