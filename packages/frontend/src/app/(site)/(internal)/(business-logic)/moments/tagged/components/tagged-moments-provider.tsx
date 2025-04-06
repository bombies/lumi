'use client';

import { createContext, FC, PropsWithChildren, useContext, useMemo, useState } from 'react';
import { Moment, RelationshipMomentTag } from '@lumi/core/types/moment.types';

import { GetMomentsForRelationshipTag, GetRelationshipMomentTags } from '@/hooks/trpc/moment-hooks';

type TaggedMomentsProviderData = {
	search: {
		tagSearch: string;
		setTagSearch: (search: string) => void;
	};
	data: {
		tags: RelationshipMomentTag[];
		isLoading: boolean;
		hasNextPage: boolean;
		fetchNextPage: () => void;
		isFetchingNextPage: boolean;
	};
	selection: {
		selectedTag?: string;
		setSelectedTag: (tag: string | undefined) => void;
	};
	moments: {
		moments: Moment[];
		isLoading: boolean;
		hasNextPage: boolean;
		fetchNextPage: () => void;
		isFetchingNextPage: boolean;
	};
};

const TaggedMomentsContext = createContext<TaggedMomentsProviderData | undefined>(undefined);

export const useTaggedMomentsData = () => {
	const context = useContext(TaggedMomentsContext);
	if (!context) throw new Error('useTaggedMomentsData must be used within a TaggedMomentsProvider');
	return context;
};

const TaggedMomentsProvider: FC<PropsWithChildren> = ({ children }) => {
	const [tagSearch, setTagSearch] = useState('');
	const {
		data: relationshipMomentTags,
		isLoading: relationshipMomentTagsLoading,
		hasNextPage: hasMoreTags,
		fetchNextPage: fetchMoreTags,
		isFetchingNextPage: isFetchingMoreTags,
	} = GetRelationshipMomentTags(tagSearch.length ? tagSearch : undefined, 20);

	const [selectedTag, setSelectedTag] = useState<string>();
	const {
		data: momentPages,
		isLoading: momentsLoading,
		hasNextPage: hasMoreMoments,
		fetchNextPage: fetchMoreMoments,
		isFetchingNextPage: isFetchingMoreMoments,
	} = GetMomentsForRelationshipTag(selectedTag, { limit: 20, order: 'desc' });

	const memoizedValue = useMemo<TaggedMomentsProviderData>(
		() => ({
			search: {
				tagSearch,
				setTagSearch,
			},
			data: {
				tags: relationshipMomentTags?.pages.flatMap(page => page.data) || [],
				isLoading: relationshipMomentTagsLoading,
				hasNextPage: hasMoreTags,
				fetchNextPage: fetchMoreTags,
				isFetchingNextPage: isFetchingMoreTags,
			},
			selection: {
				selectedTag,
				setSelectedTag,
			},
			moments: {
				moments: momentPages?.pages.flatMap(page => page.data) || [],
				isLoading: momentsLoading,
				hasNextPage: hasMoreMoments,
				fetchNextPage: fetchMoreMoments,
				isFetchingNextPage: isFetchingMoreMoments,
			},
		}),
		[
			fetchMoreMoments,
			fetchMoreTags,
			hasMoreMoments,
			hasMoreTags,
			isFetchingMoreMoments,
			isFetchingMoreTags,
			momentPages,
			momentsLoading,
			relationshipMomentTags?.pages,
			relationshipMomentTagsLoading,
			selectedTag,
			tagSearch,
		],
	);

	return <TaggedMomentsContext.Provider value={memoizedValue}>{children}</TaggedMomentsContext.Provider>;
};

export default TaggedMomentsProvider;
