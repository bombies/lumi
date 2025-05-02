'use client';

import type { Affirmation } from '@lumi/core/affirmations/affirmations.types';
import type { FC } from 'react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

import { DeleteAffirmation } from '@/hooks/trpc/affirmation-hooks';
import { TrashIcon } from 'lucide-react';
import { useCallback, useState } from 'react';

type Props = {
	affirmation: Affirmation;
};

const DeleteAffirmationButton: FC<Props> = ({ affirmation }) => {
	const { mutateAsync: deleteAffirmation, isPending: isDeleting } = DeleteAffirmation();
	const [dialogOpen, setDialogOpen] = useState(false);

	const handleDelete = useCallback(async () => {
		try {
			await deleteAffirmation(affirmation.id);
			setDialogOpen(false);
		} catch {}
	}, [affirmation.id, deleteAffirmation]);

	return (
		<AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
			<AlertDialogTrigger asChild>
				<Button size="icon" variant="destructive:flat">
					<TrashIcon size={18} />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Affirmation</AlertDialogTitle>
					<AlertDialogDescription>
						Are you absolutely sure you want to delete this affirmation? This action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
					<AlertDialogAction asChild>
						<Button onClick={handleDelete} loading={isDeleting} variant="destructive">
							Delete
						</Button>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default DeleteAffirmationButton;
