'use client';

import type { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MegaBytes } from '@/components/ui/file-upload/file-size';

import FileUpload from '@/components/ui/file-upload/file-upload';
import { DefaultImageMediaTypes } from '@/components/ui/file-upload/media-type';
import { Skeleton } from '@/components/ui/skeleton';
import UserAvatar from '@/components/ui/user-avatar';
import { GetSelfUser, UpdateUser, UploadUserAvatar } from '@/hooks/trpc/user-hooks';
import { deleteS3Object } from '@/lib/actions/s3-actions';
import { cn } from '@/lib/utils';
import { ContentPaths } from '@lumi/core/utils/s3/s3.service';
import { useState } from 'react';

const UserProfileSettings: FC = () => {
	const { data: user, isLoading: userLoading } = GetSelfUser();
	const { mutateAsync: updateUser, isPending: isUpdatingUser } = UpdateUser();
	const {
		uploadJob: uploadAvatar,
		isUploading: avatarUploading,
		currentProgress: avatarUploadProgress,
	} = UploadUserAvatar();
	const [optimisticAvatar, setOptimisticAvatar] = useState<string | undefined>();

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-2xl">Your Account</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col tablet:flex-row gap-4 items-center">
				<FileUpload
					type="single"
					disabled={userLoading || isUpdatingUser}
					uploadType="lazy"
					fileTypes={DefaultImageMediaTypes}
					crop={{
						aspect: 1,
						cropSize: {
							width: 256,
							height: 256,
						},
					}}
					maxFileSize={MegaBytes.from(25)}
					isUploading={avatarUploading || isUpdatingUser}
					serverUploadProgress={avatarUploadProgress}
					onLocalUploadSuccess={(file) => {
						setOptimisticAvatar(URL.createObjectURL(file));
					}}
					onFileRemove={() => {
						setOptimisticAvatar(undefined);
					}}
					handleServerUpload={async (file) => {
						try {
							const objectKey = await uploadAvatar(file, {});

							const oldAvatarKey = user?.avatarKey;
							await updateUser({
								avatarKey: objectKey,
							});

							if (oldAvatarKey) await deleteS3Object(ContentPaths.userAvatar(user!.id, oldAvatarKey));

							setOptimisticAvatar(URL.createObjectURL(file));
							return true;
						} catch (e) {
							console.error(e);
							return e instanceof Error ? e.message : false;
						}
					}}
				>
					{ref => (
						<UserAvatar
							user={user}
							srcOverride={optimisticAvatar}
							className={cn('cursor-pointer', avatarUploading && 'cursor-not-allowed')}
							loading={userLoading}
							hideStatus
							onClick={() => {
								if (!avatarUploading) ref.current?.click();
							}}
						/>
					)}
				</FileUpload>

				<div className="space-y-1">
					{userLoading
						? (
								<>
									<Skeleton className="w-36 h-6" />
									<Skeleton className="w-48 h-4" />
								</>
							)
						: (
								<>
									<h3 className="text-xl font-medium text-center tablet:text-left">
										{user!.firstName}
										{' '}
										{user!.lastName}
									</h3>
									<p className="text-center tablet:text-left">{user!.email}</p>
								</>
							)}
				</div>
			</CardContent>
		</Card>
	);
};

export default UserProfileSettings;
