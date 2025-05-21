'use client';

import type { ImportantDate } from '@lumi/core/calendar/calendar.types';
import type { FC } from 'react';
import { TrashIcon } from '@heroicons/react/24/solid';
import { AlertDialog, AlertDialogTrigger } from '@radix-ui/react-alert-dialog';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { DeleteImportantDate } from '@/hooks/trpc/calendar-hooks';
import { getErrorMessage } from '@/lib/trpc/utils';

type Props = {
	importantDate: ImportantDate;
};

const DeleteImportantDateButton: FC<Props> = ({ importantDate }) => {
	const { mutateAsync: deleteImportantDate, isPending: isDeleting } = DeleteImportantDate();
	const [dialogOpen, setDialogOpen] = useState(false);

	const doDelete = useCallback(() => {
		toast.promise(deleteImportantDate(importantDate.id), {
			loading: 'Deleting date...',
			success: () => {
				setDialogOpen(false);
				return 'Date deleted successfully!';
			},
			error: (e) => {
				return getErrorMessage(e, {
					defaultMessage: 'Failed to delete date',
				});
			},
		});
	}, [deleteImportantDate, importantDate.id]);

	return (
		<AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
			<AlertDialogTrigger asChild>
				<Button size="icon" variant="destructive">
					<TrashIcon className="size-[16px]" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you sure?</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete this important date? This action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>I&apos;m not sure</AlertDialogCancel>
					<AlertDialogAction
						className="bg-destructive hover:bg-destructive/80"
						disabled={isDeleting}
						onClick={doDelete}
					>
						I&apos;m sure, delete this date.
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default DeleteImportantDateButton;
