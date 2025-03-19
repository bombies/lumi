'use client';

import { FC, Fragment, ReactElement, RefObject, useCallback, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CheckIcon, XIcon } from 'lucide-react';
import Cropper, { Area, CropperProps, Point } from 'react-easy-crop';
import { toast } from 'sonner';

import { useMediaInfo } from '@/lib/hooks/useMediaInfo';
import { Button } from '../button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { Progress } from '../progress';
import { Separator } from '../separator';
import { FileSize } from './file-size';
import getCroppedImg, {
	calculateTotalDuration,
	clearInput,
	getMediaInfo,
	handleFileRemoval,
	handleLocalUpload,
	handleUpload,
	isVideoFile,
	processFiles,
} from './helpers';
import MediaType from './media-type';

export type DefaultFileUploadProps = {
	maxFileSize?: FileSize;
	/**
	 * The max video duration in seconds
	 */
	maxVideoDuration?: number;
	uploadType: 'lazy' | 'local' | 'server';
	isUploading?: boolean;
	serverUploadProgress?: number;
	onFileSizeError?: (size: number) => void;
	onFileRemove?: () => void;
	disabled?: boolean;
	fileTypes: MediaType[];
	children?: (inputRef: RefObject<HTMLInputElement | null>) => ReactElement<any> | ReactElement<any>[];
	showToast?: boolean;
	toastOptions?: FileUploadToastOptions;
};

export type FileUploadToastOptions = {
	uploadingMsg?: string;
	successMsg?: string;
	errorHandler?: (error: string) => any;
};

export type FileUploadProps = DefaultFileUploadProps &
	(
		| {
				type: 'single';
				onLocalUploadSuccess?: (file: File, clearInput: () => void) => void;
				handleServerUpload?: (file: File) => boolean | string | Promise<boolean | string>;
				maxFiles?: never;
				crop?: Partial<
					Omit<CropperProps, 'crop' | 'onCropChange' | 'zoom' | 'onZoomChange' | 'image' | 'onCropComplete'>
				>;
		  }
		| {
				type: 'multiple';
				maxFiles?: number;
				onLocalUploadSuccess?: (file: File[], clearInput: () => void) => void;
				handleServerUpload?: (file: File[]) => boolean | string | Promise<boolean | string>;
				crop: never;
		  }
	);

const FileUpload: FC<FileUploadProps> = ({
	type,
	maxFiles = undefined,
	maxFileSize,
	maxVideoDuration,
	onFileSizeError,
	onLocalUploadSuccess,
	uploadType = 'server',
	isUploading,
	handleServerUpload,
	serverUploadProgress,
	onFileRemove,
	fileTypes,
	disabled,
	children,
	showToast,
	toastOptions,
	crop: cropArgs,
}) => {
	const [currentFiles, setCurrentFiles] = useState<File[]>();
	const [showLazyPopup, setShowLazyPopup] = useState(!!cropArgs ? false : true);
	const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
	const [cropZoom, setCropZoom] = useState(1);
	const [cropModalOpen, setCropModalOpen] = useState(false);
	const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area>();

	const resetShowLazyPopup = useCallback(() => {
		setShowLazyPopup(!!cropArgs ? false : true);
	}, [cropArgs]);

	const inputRef = useRef<HTMLInputElement>(null);
	const { mediaInfo, makeReadChunk } = useMediaInfo('object');

	const uploadFilesToServer = useCallback(
		async (file: File[]) => {
			if (!handleServerUpload || !file.length) return;
			let result = type === 'single' ? handleServerUpload(file[0]) : handleServerUpload(file);
			if (result instanceof Promise) result = await result;

			if (result === true) {
				setCurrentFiles(undefined);
				resetShowLazyPopup();
				if (inputRef.current) {
					inputRef.current.value = '';
					inputRef.current.files = null;
				}
			} else throw new Error(typeof result === 'string' ? result : 'Failed to upload file');
		},
		[handleServerUpload, resetShowLazyPopup, type],
	);

	const validateFileSize = useCallback(
		(file: File) => {
			return maxFileSize ? file.size <= maxFileSize.toBytes() : true;
		},
		[maxFileSize],
	);

	const validateVideoDuration = useCallback(
		async (file: File) => {
			if (!isVideoFile(file)) return true;
			if (!maxVideoDuration) return true;

			const mediaInfoResult = await getMediaInfo(file, {
				mediaInfo,
				makeReadChunk,
			});

			if (typeof mediaInfoResult === 'string' || !mediaInfoResult?.media?.track?.length) return false;

			const totalDuration = calculateTotalDuration(mediaInfoResult.media.track);

			return totalDuration <= maxVideoDuration;
		},
		[maxVideoDuration, mediaInfo, makeReadChunk],
	);

	const handleFileActions = useCallback(
		async (fileArr: File[]) => {
			if (uploadType !== 'server' && fileArr[0] && onLocalUploadSuccess) {
				// @ts-expect-error err
				handleLocalUpload(fileArr, {
					type,
					onLocalUploadSuccess,
					clearInput: () => clearInput({ inputRef }),
				});
			} else {
				await handleUpload(fileArr, {
					uploadType,
					showToast,
					toastOptions,
					uploadFilesToServer,
				});

				clearInput({ inputRef });
			}

			if (uploadType !== 'lazy') resetShowLazyPopup();
		},
		[onLocalUploadSuccess, resetShowLazyPopup, showToast, toastOptions, type, uploadFilesToServer, uploadType],
	);

	return (
		<Fragment>
			<input
				ref={inputRef}
				multiple={type === 'multiple'}
				type="file"
				className="hidden"
				accept={fileTypes.join(',')}
				disabled={disabled || isUploading}
				onChange={async e => {
					e.preventDefault();

					const clearInputHandler = () => clearInput({ inputRef });

					const allFiles = e.target.files;
					if (!allFiles?.length) {
						handleFileRemoval();
						return Promise.resolve();
					}

					const files = await processFiles(allFiles, {
						type,
						validateFileSize,
						validateVideoDuration,
						onFileSizeError,
						maxVideoDuration,
						maxFiles,
					});
					if (!files) return;

					setCurrentFiles(files);
					clearInputHandler();

					if (type === 'single' && cropArgs) {
						setCropModalOpen(true);
						return;
					}

					await handleFileActions(files);
				}}
			/>
			<div className="relative flex flex-col justify-start items-start gap-4">
				{children?.(inputRef)}
				{showLazyPopup ? (
					<AnimatePresence>
						{uploadType === 'lazy' && currentFiles && (
							<Popover open={true}>
								<PopoverTrigger className="opacity-0 p-0 m-0 size-0">confirm</PopoverTrigger>
								<PopoverContent>
									<h3 className="text-lg">Confirm Upload</h3>
									<Separator className="my-2" />
									<div className="bg-primary/20 text-primary px-4 py-2 rounded-xl break-all text-wrap mb-4">
										<p className="text-xs ">{currentFiles.map(file => file.name).join(', ')}</p>
									</div>
									<div className="flex gap-4">
										<Button
											disabled={isUploading || disabled}
											loading={isUploading}
											size="sm"
											className="self-center"
											variant="default:flat"
											onClick={async () => {
												const defaultErrorHandler = (msg: string) =>
													`There was an error uploading that file: ${msg}`;
												toast.promise(uploadFilesToServer(currentFiles), {
													loading: toastOptions?.uploadingMsg ?? 'Uploading file...',
													success: toastOptions?.successMsg ?? 'Successfully uploaded file!',
													error: toastOptions?.errorHandler ?? defaultErrorHandler,
												});
											}}
										>
											<CheckIcon width={16} height={16} className="mr-4" /> Upload
										</Button>
										<Button
											disabled={isUploading || disabled}
											size="sm"
											variant="destructive:flat"
											className="self-center"
											onClick={() => {
												setCurrentFiles(undefined);
												resetShowLazyPopup();
												if (inputRef.current) {
													inputRef.current.value = '';
													inputRef.current.files = null;
												}

												if (onFileRemove) onFileRemove();
											}}
										>
											<XIcon width={16} height={16} className="mr-4" /> Cancel
										</Button>
									</div>
									{isUploading && serverUploadProgress !== undefined && (
										<Progress className="mt-4 h-2" value={serverUploadProgress} />
									)}
								</PopoverContent>
							</Popover>
						)}
					</AnimatePresence>
				) : (
					<Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Crop Image</DialogTitle>
							</DialogHeader>
							<div className="relative w-full h-96">
								<Cropper
									image={currentFiles && URL.createObjectURL(currentFiles[0])}
									crop={crop}
									zoom={cropZoom}
									onCropChange={c => setCrop(c)}
									onZoomChange={setCropZoom}
									onCropComplete={async (croppedArea, areaPixels) => {
										setCroppedAreaPixels(areaPixels);
									}}
									{...cropArgs}
								/>
							</div>
							<div className="flex gap-2">
								<Button
									onClick={async () => {
										if (!currentFiles || !croppedAreaPixels) return;
										const croppedImage = await getCroppedImg(
											URL.createObjectURL(currentFiles[0]),
											croppedAreaPixels,
										);

										if (!croppedImage) return;

										const file = new File([croppedImage], currentFiles[0].name, {
											type: currentFiles[0].type,
										});

										setCurrentFiles([file]);

										// Continue upload flow
										setShowLazyPopup(true);
										setCropModalOpen(false);
										await handleFileActions([file]);
									}}
								>
									Crop Image
								</Button>
								<Button
									onClick={() => {
										setCropModalOpen(false);
										setCroppedAreaPixels(undefined);
										setCrop({ x: 0, y: 0 });
										setCropZoom(1);
										setCurrentFiles(undefined);
										clearInput({ inputRef });
									}}
									variant="destructive:flat"
								>
									Cancel Upload
								</Button>
							</div>
						</DialogContent>
					</Dialog>
				)}
			</div>
		</Fragment>
	);
};

export default FileUpload;
