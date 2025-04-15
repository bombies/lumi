'use client';

import { RefObject } from 'react';
import mime from 'mime';
import { Area } from 'react-easy-crop';
import { toast } from 'sonner';

import { FileUploadToastOptions } from './file-upload';

export const isVideoFile = (file: File): boolean => {
	return mime.getType(file.name)?.startsWith('video') ?? false;
};

export const handleFileRemoval = (onFileRemove?: () => void) => {
	onFileRemove?.();
};

const handleFileSizeError = (
	size: number,
	{
		onFileSizeError,
	}: {
		onFileSizeError?: (size: number) => void;
	},
) => {
	if (onFileSizeError) onFileSizeError(size);
	else toast.error('That file is too big!');
};

const handleVideoDurationError = (
	file: File,
	{
		maxVideoDuration,
	}: {
		maxVideoDuration?: number;
	},
) => {
	toast.error(`That video is too long! The maximum duration is ${maxVideoDuration} seconds.`);
};

const validateFile = async (
	file: File,
	{
		validateFileSize,
		validateVideoDuration,
		onFileSizeError,
		maxVideoDuration,
	}: {
		validateFileSize: (file: File) => boolean;
		validateVideoDuration: (file: File) => Promise<boolean>;
		onFileSizeError?: (size: number) => void;
		maxVideoDuration?: number;
	},
): Promise<boolean> => {
	if (!validateFileSize(file)) {
		handleFileSizeError(file.size, { onFileSizeError });
		return false;
	}

	if (!(await validateVideoDuration(file))) {
		handleVideoDurationError(file, { maxVideoDuration });
		return false;
	}

	return true;
};

export const processFiles = async (
	allFiles: FileList,
	{
		type,
		validateFileSize,
		validateVideoDuration,
		onFileSizeError,
		maxVideoDuration,
		maxFiles,
	}: {
		type: 'single' | 'multiple';
		validateFileSize: (file: File) => boolean;
		validateVideoDuration: (file: File) => Promise<boolean>;
		onFileSizeError?: (size: number) => void;
		maxVideoDuration?: number;
		maxFiles?: number;
	},
): Promise<File[] | null> => {
	let files: File[];

	if (type === 'single') {
		const file = allFiles[0];
		if (
			!file ||
			!(await validateFile(file, {
				validateFileSize,
				validateVideoDuration,
				onFileSizeError,
				maxVideoDuration,
			}))
		)
			return null;
		files = [file];
	} else {
		if (maxFiles && allFiles.length > maxFiles) {
			toast.error(`You can only upload up to ${maxFiles} files.`);
			return null;
		}

		for (const file of allFiles) {
			if (
				!(await validateFile(file, {
					validateFileSize,
					validateVideoDuration,
					onFileSizeError,
					maxVideoDuration,
				}))
			)
				return null;
		}

		files = Array.from(allFiles);
	}

	return files;
};

export const clearInput = ({ inputRef }: { inputRef: RefObject<HTMLInputElement | null> }) => {
	if (inputRef.current) {
		inputRef.current.value = '';
		inputRef.current.files = null;
	}
};

export const handleLocalUpload = (
	files: File[],
	{
		type,
		onLocalUploadSuccess,
		clearInput,
	}:
		| {
				type: 'single';
				onLocalUploadSuccess?: (file: File, clearInput: () => void) => void;
				clearInput: () => void;
		  }
		| {
				type: 'multiple';
				onLocalUploadSuccess?: (file: File[], clearInput: () => void) => void;
				clearInput: () => void;
		  },
) => {
	return type === 'single' ? onLocalUploadSuccess?.(files[0], clearInput) : onLocalUploadSuccess?.(files, clearInput);
};

export const handleUpload = async (
	files: File[],
	{
		uploadType,
		showToast,
		uploadFilesToServer,
		toastOptions,
	}: {
		uploadType: 'lazy' | 'local' | 'server';
		showToast?: boolean;
		uploadFilesToServer: (file: File[]) => Promise<void>;
		toastOptions?: FileUploadToastOptions;
	},
) => {
	const upload = async () => {
		if (uploadType === 'server') return uploadFilesToServer(files);
	};

	if (showToast) {
		toast.promise(upload(), {
			loading: toastOptions?.uploadingMsg ?? 'Uploading file...',
			success: toastOptions?.successMsg ?? 'Successfully uploaded file!',
			error: toastOptions?.errorHandler ?? ((msg: string) => `There was an error uploading that file: ${msg}`),
		});
	} else {
		await upload();
	}
};

export const createImage = (url: string) =>
	new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image();
		image.addEventListener('load', () => resolve(image));
		image.addEventListener('error', error => reject(error));
		image.setAttribute('crossOrigin', 'anonymous');
		image.src = url;
	});

export function getRadianAngle(degreeValue: number) {
	return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width: number, height: number, rotation: number) {
	const rotRad = getRadianAngle(rotation);

	return {
		width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
		height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
	};
}

export default async function getCroppedImg(
	imageSrc: string,
	pixelCrop: Area,
	rotation = 0,
	flip = { horizontal: false, vertical: false },
) {
	const image = await createImage(imageSrc);
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	if (!ctx) {
		return null;
	}

	const rotRad = getRadianAngle(rotation);

	// calculate bounding box of the rotated image
	const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);

	// set canvas size to match the bounding box
	canvas.width = bBoxWidth;
	canvas.height = bBoxHeight;

	// translate canvas context to a central location to allow rotating and flipping around the center
	ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
	ctx.rotate(rotRad);
	ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
	ctx.translate(-image.width / 2, -image.height / 2);

	// draw rotated image
	ctx.drawImage(image, 0, 0);

	const croppedCanvas = document.createElement('canvas');

	const croppedCtx = croppedCanvas.getContext('2d');

	if (!croppedCtx) {
		return null;
	}

	// Set the size of the cropped canvas
	croppedCanvas.width = pixelCrop.width;
	croppedCanvas.height = pixelCrop.height;

	// Draw the cropped image onto the new canvas
	croppedCtx.drawImage(
		canvas,
		pixelCrop.x,
		pixelCrop.y,
		pixelCrop.width,
		pixelCrop.height,
		0,
		0,
		pixelCrop.width,
		pixelCrop.height,
	);

	// As Base64 string
	// return croppedCanvas.toDataURL('image/jpeg');

	// As a blob
	return new Promise<Blob>((resolve, reject) => {
		croppedCanvas.toBlob(file => {
			if (!file) {
				reject(new Error('Failed to create blob'));
				return;
			}
			resolve(file);
		}, 'image/jpeg');
	});
}
