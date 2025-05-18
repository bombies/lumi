'use client';

import type { FC } from 'react';
import { XIcon } from 'lucide-react';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import InfiniteLoader from '@/components/ui/infinite-loader';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import CreateMomentTagButton from '../../components/create-moment-tag.button';
import MomentsGridContent from '../../components/moments-grid-content';
import DeleteTagButton from './delete-tag-button';
import { useTaggedMomentsData } from './tagged-moments-provider';

const SpaciousTaggedMomentsView: FC = () => {
	const {
		search: { setTagSearch },
		data: {
			tags,
			isLoading: tagsLoading,
			hasNextPage: hasMoreTags,
			fetchNextPage: fetchMoreTags,
			isFetchingNextPage: isFetchingMoreTags,
		},
		selection: { setSelectedTag, selectedTag },
		moments: {
			moments,
			isLoading: momentsLoading,
			hasNextPage: hasMoreMoments,
			fetchNextPage: fetchMoreMoments,
			isFetchingNextPage: isFetchingMoreMoments,
		},
	} = useTaggedMomentsData();

	const tagElements = useMemo(
		() =>
			tags.map(tag => (
				<Card
					className="p-6 h-48 tablet:h-92 bg-accent hover:bg-primary text-accent-foreground cursor-pointer"
					onClick={() => setSelectedTag(tag.tag)}
					key={`${tag.relationshipId}#${tag.tag}`}
				>
					<CardHeader className="p-0">
						<CardTitle className="text-bold text-4xl break-words">
							#
							{tag.tag}
						</CardTitle>
						<CardDescription className="bg-accent-foreground text-accent px-2 py-1 rounded-lg w-fit text-xs">
							{tag.associationCount}
							{' '}
							moments
						</CardDescription>
					</CardHeader>
				</Card>
			)),
		[setSelectedTag, tags],
	);

	return (
		<>
			<div className="flex flex-col tablet:flex-row gap-4">
				{!selectedTag
					? (
							<Input className="w-96" placeholder="Search for a tag" onTypingEnd={setTagSearch} />
						)
					: (
							<>
								<Button variant="default:flat" onClick={() => setSelectedTag(undefined)} className="relative">
									#
									{selectedTag}
									<span className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive/40 border border-destructive text-destructive">
										<XIcon className="size-[12px]" />
									</span>
								</Button>
								<DeleteTagButton tag={selectedTag} onDelete={() => setSelectedTag(undefined)} />
							</>
						)}
				<CreateMomentTagButton />
			</div>
			<div>
				{selectedTag
					? (
							<MomentsGridContent
								moments={moments}
								momentsLoading={momentsLoading}
								infiniteOpts={{
									hasNextPage: hasMoreMoments,
									fetchNextPage: fetchMoreMoments,
									isFetchingNextPage: isFetchingMoreMoments,
								}}
							/>
						)
					: tagsLoading
						? (
								<div className="grid gap-4 grid-cols-1 phone-big:grid-cols-2 tablet:grid-cols-3 laptop:grid-cols-4 desktop:grid-cols-5">
									<Skeleton className="h-48 tablet:h-92 w-full" />
									<Skeleton className="h-48 tablet:h-92 w-full" />
									<Skeleton className="h-48 tablet:h-92 w-full" />
									<Skeleton className="h-48 tablet:h-92 w-full" />
									<Skeleton className="h-48 tablet:h-92 w-full" />
								</div>
							)
						: tags.length
							? (
									<>
										<div className="grid gap-4 grid-cols-1 phone-big:grid-cols-2 tablet:grid-cols-3 laptop:grid-cols-4 desktop:grid-cols-5">
											{tagElements}
										</div>
										<InfiniteLoader hasMore={hasMoreTags} fetchMore={fetchMoreTags} loading={isFetchingMoreTags} />
									</>
								)
							: (
									<div className="p-6 max-w-sm border border-primary bg-primary/10 rounded-md border-dashed">
										<p className="text-lg font-medium">There are no tags...</p>
										<Separator className="my-2" />
										<p className="text-sm">
											<span className="text-primary font-bold">Tip:</span>
											{' '}
											Create a new tag to have it show up
											here!
										</p>
									</div>
								)}
			</div>
		</>
	);
};

export default SpaciousTaggedMomentsView;
