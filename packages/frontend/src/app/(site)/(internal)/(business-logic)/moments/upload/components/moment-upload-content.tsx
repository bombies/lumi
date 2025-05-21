'use client';

import type { FC } from 'react';
import { UploadIcon } from 'lucide-react';
import { useState } from 'react';

import { MegaBytes } from '@/components/ui/file-upload/file-size';
import FileUpload from '@/components/ui/file-upload/file-upload';
import { DefaultVideoMediaTypes } from '@/components/ui/file-upload/media-type';
import MomentUploadForm from './moment-upload-form';

const MomentUploadContent: FC = () => {
	const [momentFile, setMomentFile] = useState<File>();
	return !momentFile
		? (
				<>
					<FileUpload
						type="single"
						uploadType="local"
						fileTypes={DefaultVideoMediaTypes}
						onLocalUploadSuccess={file => setMomentFile(file)}
						maxFileSize={MegaBytes.from(250)}
						maxVideoDuration={60}
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
			)
		: (
				<MomentUploadForm momentFile={momentFile} onCancel={() => setMomentFile(undefined)} />
			);
};

export default MomentUploadContent;
