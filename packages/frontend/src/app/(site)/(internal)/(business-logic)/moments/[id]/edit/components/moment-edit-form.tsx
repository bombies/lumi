'use client';

import { FC, useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Moment } from '@lumi/core/types/moment.types';
import { UploadIcon, XIcon } from 'lucide-react';
import Player from 'next-video/player';
import MediaThemeInstaplay from 'player.style/instaplay/react';
import { SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import EasyForm from '@/components/ui/form-extras/easy-form';
import EasyFormField from '@/components/ui/form-extras/easy-form-field';
import EasyFormSelect from '@/components/ui/form-extras/fields/easy-form-select';
import InfiniteLoader from '@/components/ui/infinite-loader';
import { Input } from '@/components/ui/input';
import { SelectOption } from '@/components/ui/multiselect';
import { Textarea } from '@/components/ui/textarea';
import Title from '@/components/ui/title';
import { GetMomentTags, GetRelationshipMomentTags, UpdateMomentDetails } from '@/hooks/trpc/moment-hooks';
import { handleTrpcError } from '@/lib/trpc/utils';
import CreateMomentTagButton from '../../../components/create-moment-tag.button';

const momentFormDetailsSchema = z.object({
	title: z.string().min(1).max(90),
	tags: z.array(z.string()).optional(),
	description: z.string().min(0).max(1024).optional(),
});

type MomentFormDetailsSchema = z.infer<typeof momentFormDetailsSchema>;

type Props = {
	moment: Moment;
};

const MomentEditForm: FC<Props> = ({ moment }) => {
	const [tagSearch, setTagSearch] = useState('');
	const {
		data: relationshipMomentTags,
		isLoading: relationshipMomentTagsLoading,
		hasNextPage: hasMoreTags,
		fetchNextPage: fetchMoreTags,
		isFetchingNextPage: isFetchingMoreTags,
	} = GetRelationshipMomentTags(tagSearch.length ? tagSearch : undefined, 20);
	const { mutateAsync: updateDetails, isPending: isUpdatingDetails } = UpdateMomentDetails();
	const { data: currentTags, isLoading: currentTagsLoading } = GetMomentTags(moment.id);
	const router = useRouter();

	const momentTags = useMemo(
		() =>
			relationshipMomentTags?.pages.flatMap(page =>
				page.data.map<SelectOption>(tag => ({
					label: `#${tag.tag}`,
					value: tag.tag,
				})),
			),
		[relationshipMomentTags?.pages],
	);

	const onSubmit = useCallback<SubmitHandler<MomentFormDetailsSchema>>(
		async data => {
			try {
				await updateDetails({ momentId: moment.id, ...data });

				// Handle success
				toast.success('Successfully updated moment details!');
				router.push(`/moments/${moment.id}`);
			} catch (e) {
				handleTrpcError(e, {
					useErrorObjectMessage: true,
				});
			}
		},
		[moment.id, router, updateDetails],
	);

	return (
		<div className="flex flex-col gap-6 phone-big:flex-row">
			<div className="h-[256px] max-w-[128px] phone-big:h-[70vh] phone-big:max-w-[496px] aspect-[9/16] mx-auto phone-big:mx-0 shrink-0">
				<Player
					src={moment.videoUrl}
					className="aspect-[9/16]"
					autoPlay
					theme={MediaThemeInstaplay}
					loop
					playsInline
				/>
			</div>
			<div className="w-full phone-big:w-[35rem] space-y-6">
				<Title className="text-3xl">Moment Details</Title>
				<EasyForm
					schema={momentFormDetailsSchema}
					onSubmit={onSubmit}
					className="space-y-6"
					submitting={isUpdatingDetails}
				>
					<EasyFormField<MomentFormDetailsSchema>
						name="title"
						label="Title"
						defaultValue={moment.title}
						showErrorMessage
					>
						<Input maxLength={90} placeholder="Enter a title for your moment" />
					</EasyFormField>
					<div className="flex flex-col tablet:flex-row gap-2 items-end">
						<EasyFormSelect<MomentFormDetailsSchema>
							name="tags"
							label="Tags"
							optional
							options={momentTags ?? []}
							optionsLoading={relationshipMomentTagsLoading}
							defaultValue={currentTags?.map(tag => tag.tag) ?? undefined}
							disabled={currentTagsLoading}
							onSearch={setTagSearch}
							itemsFooter={
								<InfiniteLoader
									hasMore={hasMoreTags}
									fetchMore={fetchMoreTags}
									loading={isFetchingMoreTags}
								/>
							}
						/>
						<CreateMomentTagButton disabled={currentTagsLoading} />
					</div>
					<EasyFormField<MomentFormDetailsSchema>
						name="description"
						label="Description"
						defaultValue={moment.description}
						showErrorMessage
					>
						<Textarea
							maxLength={1024}
							className="h-96"
							placeholder="Enter a description for your moment"
							rows={10}
						/>
					</EasyFormField>
					<div className="flex gap-4">
						<div className="space-x-2">
							<Button
								type="submit"
								variant="accent"
								loading={isUpdatingDetails}
								disabled={currentTagsLoading}
							>
								<UploadIcon size={18} /> Update Moment
							</Button>
						</div>
						<Link href={`/moments/${moment.id}`}>
							<Button variant="destructive:flat" disabled={isUpdatingDetails}>
								<XIcon size={18} /> Go back
							</Button>
						</Link>
					</div>
				</EasyForm>
			</div>
		</div>
	);
};

export default MomentEditForm;
