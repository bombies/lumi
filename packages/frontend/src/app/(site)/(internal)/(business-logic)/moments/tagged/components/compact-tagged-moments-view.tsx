'use client';

import { FC, useMemo } from 'react';

import InfiniteLoader from '@/components/ui/infinite-loader';
import { Select, SelectOption } from '@/components/ui/multiselect';
import { Separator } from '@/components/ui/separator';
import CreateMomentTagButton from '../../components/create-moment-tag.button';
import MomentsGridContent from '../../components/moments-grid-content';
import DeleteTagButton from './delete-tag-button';
import { useTaggedMomentsData } from './tagged-moments-provider';

export const CompactTaggedMomentsView: FC = () => {
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

	const momentTags = useMemo(
		() =>
			tags.map<SelectOption>(tag => ({
				label: (
					<p>
						#{tag.tag}{' '}
						<span className="bg-secondary text-secondary-foreground rounded-md py-1 px-2 text-xs border border-border">
							{tag.associationCount}
						</span>
					</p>
				),
				display: `#${tag.tag}`,
				value: tag.tag,
			})),
		[tags],
	);

	return (
		<>
			<div className="flex flex-col tablet:flex-row gap-2">
				<Select
					type="single"
					className="w-96"
					placeholder="Select a tag"
					selected={selectedTag ? [selectedTag] : []}
					onChange={selected => setSelectedTag(selected[0])}
					options={momentTags ?? []}
					optionsLoading={tagsLoading}
					onSearch={setTagSearch}
					itemsFooter={
						<InfiniteLoader hasMore={hasMoreTags} fetchMore={fetchMoreTags} loading={isFetchingMoreTags} />
					}
				/>
				{selectedTag && (
					<>
						<DeleteTagButton tag={selectedTag} onDelete={() => setSelectedTag(undefined)} />
					</>
				)}
				<CreateMomentTagButton />
			</div>
			{selectedTag ? (
				<MomentsGridContent
					moments={moments}
					momentsLoading={momentsLoading}
					infiniteOpts={{
						hasNextPage: hasMoreMoments,
						fetchNextPage: fetchMoreMoments,
						isFetchingNextPage: isFetchingMoreMoments,
					}}
				/>
			) : (
				<div className="p-6 max-w-sm border border-primary bg-primary/10 rounded-md border-dashed">
					<p className="text-lg font-medium">You have not selected any tags...</p>
					<Separator className="my-2" />
					<p className="text-sm">
						<span className="text-primary font-bold">Tip:</span> Select a tag to view all moments for that
						tag.
					</p>
				</div>
			)}
		</>
	);
};

export default CompactTaggedMomentsView;
