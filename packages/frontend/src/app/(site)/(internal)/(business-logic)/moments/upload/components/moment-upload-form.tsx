'use client';

import { FC, useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadIcon, XIcon } from 'lucide-react';
import Player from 'next-video/player';
import MediaThemeInstaplay from 'player.style/instaplay/react';
import { SubmitHandler } from 'react-hook-form';
import { z } from 'zod';

import { useRelationship } from '@/components/providers/relationships/relationship-provder';
import { Button } from '@/components/ui/button';
import EasyForm from '@/components/ui/form-extras/easy-form';
import EasyFormField from '@/components/ui/form-extras/easy-form-field';
import EasyFormSelect from '@/components/ui/form-extras/fields/easy-form-select';
import InfiniteLoader from '@/components/ui/infinite-loader';
import { Input } from '@/components/ui/input';
import { SelectOption } from '@/components/ui/multiselect';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import Title from '@/components/ui/title';
import { CreateMomentDetails, GetRelationshipMomentTags, UploadMoment } from '@/hooks/trpc/moment-hooks';
import { handleTrpcError } from '@/lib/trpc/utils';
import CreateMomentTagButton from '../../components/create-moment-tag.button';

const momentFormDetailsSchema = z.object({
	title: z.string().min(1).max(90),
	tags: z.array(z.string()).optional(),
	description: z.string().min(0).max(1024).optional(),
});

type MomentFormDetailsSchema = z.infer<typeof momentFormDetailsSchema>;

type Props = {
	momentFile: File;
	onCancel: () => void;
};

const MomentUploadForm: FC<Props> = ({ momentFile, onCancel }) => {
	const { self, sendNotificationToPartner } = useRelationship();
	const [isUploading, setIsUploading] = useState(false);
	const [tagSearch, setTagSearch] = useState('');
	const {
		data: relationshipMomentTags,
		isLoading: relationshipMomentTagsLoading,
		hasNextPage: hasMoreTags,
		fetchNextPage: fetchMoreTags,
		isFetchingNextPage: isFetchingMoreTags,
	} = GetRelationshipMomentTags(tagSearch.length ? tagSearch : undefined, 20);
	const {
		uploadJob: uploadMoment,
		isUploading: momentUploading,
		currentProgress: momentUploadProgress,
	} = UploadMoment();
	const { mutateAsync: createMomentDetails, isPending: momentDetailsCreating } = CreateMomentDetails();
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
			setIsUploading(true);

			try {
				if (!momentFile) throw new Error('No moment file selected');

				const extension = momentFile?.name.split('.').pop();

				if (!extension) throw new Error('Invalid file extension');

				const objectKey = crypto.randomUUID();
				const fileName = await uploadMoment(momentFile, {
					fileExtension: extension,
					objectKey,
				});

				const momentDetails = await createMomentDetails({
					title: data.title,
					description: data.description,
					objectKey: fileName,
					tags: data.tags,
				});

				await sendNotificationToPartner({
					title: '📽️ New Moment Shared',
					content: `${self?.firstName} has shared a new moment with you titled: ${momentDetails.title}`,
					openUrl: `/moments/${momentDetails.id}`,
				});

				// Handle success
				router.push(`/moments/${momentDetails.id}`);
			} catch (e) {
				handleTrpcError(e, {
					useErrorObjectMessage: true,
				});
			} finally {
				setIsUploading(false);
			}
		},
		[createMomentDetails, momentFile, router, self?.firstName, sendNotificationToPartner, uploadMoment],
	);

	return (
		<div className="flex flex-col gap-6 phone-big:flex-row">
			<div className="h-[256px] max-w-[128px] phone-big:h-[70vh] phone-big:max-w-[496px] aspect-[9/16] mx-auto phone-big:mx-0 shrink-0">
				<Player
					src={URL.createObjectURL(momentFile)}
					className="aspect-[9/16]"
					autoPlay
					theme={MediaThemeInstaplay}
					loop
					playsInline
					muted
				/>
			</div>
			<div className="w-full phone-big:w-[35rem] space-y-6">
				<Title className="text-3xl">Moment Details</Title>
				<EasyForm
					schema={momentFormDetailsSchema}
					onSubmit={onSubmit}
					className="space-y-6"
					submitting={momentUploading || isUploading || momentDetailsCreating}
				>
					<EasyFormField<MomentFormDetailsSchema> name="title" label="Title" showErrorMessage>
						<Input maxLength={90} placeholder="Enter a title for your moment" />
					</EasyFormField>
					<div className="flex flex-col tablet:flex-row gap-2 items-end">
						<EasyFormSelect<MomentFormDetailsSchema>
							name="tags"
							label="Tags"
							optional
							options={momentTags ?? []}
							optionsLoading={relationshipMomentTagsLoading}
							onSearch={setTagSearch}
							itemsFooter={
								<InfiniteLoader
									hasMore={hasMoreTags}
									fetchMore={fetchMoreTags}
									loading={isFetchingMoreTags}
								/>
							}
						/>
						<CreateMomentTagButton />
					</div>
					<EasyFormField<MomentFormDetailsSchema> name="description" label="Description" showErrorMessage>
						<Textarea
							maxLength={1024}
							className="h-96"
							placeholder="Enter a description for your moment"
							rows={10}
						/>
					</EasyFormField>
					<div className="flex gap-4">
						<div className="flex flex-col gap-y-2">
							<Button
								type="submit"
								variant="accent"
								loading={isUploading || momentUploading || momentDetailsCreating}
							>
								<UploadIcon size={18} /> Upload Moment
							</Button>
							{isUploading && <Progress value={momentUploadProgress} />}
						</div>

						<Button
							variant="destructive:flat"
							disabled={momentUploading || isUploading || momentDetailsCreating}
							onClick={onCancel}
						>
							<XIcon size={18} /> Cancel Upload
						</Button>
					</div>
				</EasyForm>
			</div>
		</div>
	);
};

export default MomentUploadForm;
