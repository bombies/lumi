'use client';

import type { SongRecommendation } from '@lumi/core/song-recommendations/song-recommendation.types';
import type { FC } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { StarIcon } from '@heroicons/react/24/solid';
import { useCallback, useState } from 'react';
import { z } from 'zod';

import { useRelationship } from '@/components/providers/relationships/relationship-provder';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import EasyForm from '@/components/ui/form-extras/easy-form';
import EasyFormField from '@/components/ui/form-extras/easy-form-field';
import EasyFormInput from '@/components/ui/form-extras/fields/easy-form-input';
import { Input } from '@/components/ui/input';
import { UpdateSongRecommendation } from '@/hooks/trpc/music-sharing-hooks';

type Props = {
	track: SongRecommendation;
	onRate?: () => void;
};

const formSchema = z.object({
	rating: z.coerce.number().min(0).max(10),
	comments: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

const RateRecommendationButton: FC<Props> = ({ track, onRate }) => {
	const { self, sendNotificationToPartner } = useRelationship();
	const { mutateAsync: updateSongRec, isPending: isUpdatingSongRec } = UpdateSongRecommendation();
	const [dialogOpen, setDialogOpen] = useState(false);

	const handleSubmit = useCallback<SubmitHandler<FormSchema>>(
		async (data) => {
			try {
				await updateSongRec({
					recId: track.id,
					rating: data.rating,
					comments: data.comments,
					listened: true,
				});
				setDialogOpen(false);
				onRate?.();

				await sendNotificationToPartner({
					title: 'Song Recommendation Rated',
					content: `${self.firstName} has given "${track.track.name}" a ${data.rating}/10 rating. ${data.comments?.length ? `Comments: ${data.comments}` : ''}`,
					openUrl: '/music-sharing',
				});
			} catch {}
		},
		[onRate, self.firstName, sendNotificationToPartner, track.id, track.track.name, updateSongRec],
	);

	return (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
			<DialogTrigger asChild>
				<Button variant="secondary">
					<StarIcon className="size-[18px]" />
					{' '}
					Rate Recommendation
				</Button>
			</DialogTrigger>
			<DialogContent
				className="p-6 gap-2 max-h-screen overflow-y-auto bg-background/50 backdrop-blur-lg"
				hideCloseButton
			>
				<DialogTitle className="text-2xl mb-4">
					Rate
					{' '}
					{track.track.name}
					{' '}
					by
					{' '}
					{track.track.artistName}
				</DialogTitle>
				<EasyForm
					schema={formSchema}
					onSubmit={handleSubmit}
					disabled={isUpdatingSongRec}
					className="space-y-6"
				>
					<EasyFormField<FormSchema> name="rating" label="Rating (Out of 10)" showErrorMessage>
						{(_form, { ref, ...field }) => (
							<div className="flex gap-2 items-center">
								<Input
									className="min-w-10 max-w-16 rounded-sm"
									inputMode="decimal"
									min={0}
									max={10}
									ref={ref}
									{...field}
								/>
								<span className="text-foreground/50">/</span>
								<span>10</span>
							</div>
						)}
					</EasyFormField>
					<EasyFormInput<FormSchema>
						type="textarea"
						name="comments"
						label="Comments"
						optional
						inputProps={{
							rows: 20,
							className: 'min-h-24 resize-none',
						}}
					/>
					<Button
						type="submit"
						variant="accent"
						loading={isUpdatingSongRec}
						className="justify-start h-fit max-w-full break-words"
					>
						<StarIcon className="size-[18px]" />
						<span className="break-all">
							Rate
							{' '}
							{track.track.name}
							{' '}
							by
							{' '}
							{track.track.artistName}
						</span>
					</Button>
				</EasyForm>
			</DialogContent>
		</Dialog>
	);
};

export default RateRecommendationButton;
