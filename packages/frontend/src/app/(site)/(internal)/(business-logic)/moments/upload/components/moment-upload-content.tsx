'use client';

import { FC, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadIcon, XIcon } from 'lucide-react';
import Player from 'next-video/player';
import MediaThemeInstaplay from 'player.style/instaplay/react';
import { SubmitHandler } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { MegaBytes } from '@/components/ui/file-upload/file-size';
import FileUpload from '@/components/ui/file-upload/file-upload';
import { DefaultVideoMediaTypes } from '@/components/ui/file-upload/media-type';
import EasyForm from '@/components/ui/form-extras/easy-form';
import EasyFormField from '@/components/ui/form-extras/easy-form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Title from '@/components/ui/title';
import { CreateMomentDetails, UploadMoment } from '@/hooks/trpc/moment-hooks';
import { handleTrpcError } from '@/lib/trpc/utils';

const momentFormDetailsSchema = z.object({
	title: z.string().min(1).max(90),
	description: z.string().min(0).max(1024).optional(),
});

type MomentFormDetailsSchema = z.infer<typeof momentFormDetailsSchema>;

const MomentUploadContent: FC = () => {
	const [momentFile, setMomentFile] = useState<File>();
	const [isUploading, setIsUploading] = useState(false);
	const {
		uploadJob: uploadMoment,
		isUploading: momentUploading,
		currentProgress: momentUploadProgress,
	} = UploadMoment();
	const { mutateAsync: createMomentDetails, isPending: momentDetailsCreating } = CreateMomentDetails();
	const router = useRouter();

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
		[createMomentDetails, momentFile, router, uploadMoment],
	);

	return !momentFile ? (
		<>
			<FileUpload
				type="single"
				uploadType="local"
				fileTypes={DefaultVideoMediaTypes}
				disabled={momentUploading}
				onLocalUploadSuccess={file => setMomentFile(file)}
				maxFileSize={MegaBytes.from(250)}
				maxVideoDuration={20}
			>
				{ref => (
					<button
						onClick={() => ref.current?.click()}
						className="cursor-pointer w-full tablet:w-96 h-64 tablet:mx-auto border border-primary text-primary font-semibold rounded-xl bg-primary/10 border-dashed flex flex-col gap-6 justify-center items-center"
					>
						<UploadIcon size={32} />
						<span className="max-w-1/2 text-center">Click here to select a moment from your device</span>
					</button>
				)}
			</FileUpload>
		</>
	) : (
		<div className="flex flex-col gap-6 phone-big:flex-row">
			<div className="h-[256px] max-w-[128px] phone-big:h-[70vh] phone-big:max-w-[496px] aspect-[9/16] mx-auto phone-big:mx-0 shrink-0">
				<Player
					src={URL.createObjectURL(momentFile)}
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
					disabled={momentUploading || isUploading || momentDetailsCreating}
				>
					<EasyFormField<MomentFormDetailsSchema> name="title" label="Title" showErrorMessage>
						<Input maxLength={90} placeholder="Enter a title for your moment" />
					</EasyFormField>
					<EasyFormField<MomentFormDetailsSchema> name="description" label="Description" showErrorMessage>
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
								loading={isUploading || momentUploading || momentDetailsCreating}
							>
								<UploadIcon size={18} /> Upload Moment
							</Button>
							{isUploading && (
								<span className="bg-accent/20 text-accent px-x py-2 rounded-sm text-xs">
									{momentUploadProgress}% Done
								</span>
							)}
						</div>

						<Button
							variant="destructive:flat"
							disabled={momentUploading || isUploading || momentDetailsCreating}
							onClick={() => setMomentFile(undefined)}
						>
							<XIcon size={18} /> Cancel Upload
						</Button>
					</div>
				</EasyForm>
			</div>
		</div>
	);
};

export default MomentUploadContent;
