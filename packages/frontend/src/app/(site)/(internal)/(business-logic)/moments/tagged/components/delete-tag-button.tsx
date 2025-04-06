'use client';

import { FC, useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/solid';
import { toast } from 'sonner';

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
import { DeleteRelationshipMomentTag } from '@/hooks/trpc/moment-hooks';

type Props = {
	tag: string;
	onDelete?: () => void;
};

const DeleteTagButton: FC<Props> = ({ tag, onDelete }) => {
	const [dialogOpen, setDialogOpen] = useState(false);
	const { mutateAsync: deleteTag, isPending: isDeleting } = DeleteRelationshipMomentTag();

	return (
		<AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
			<AlertDialogTrigger asChild>
				<Button variant="destructive:flat">
					<TrashIcon className="size-[18px]" /> Delete #{tag}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you sure you want to delete #{tag}</AlertDialogTitle>
					<AlertDialogDescription>
						Deleting #{tag} will also remove the tag from all videos associated with it. This action is
						irreversible.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogAction
						disabled={isDeleting}
						className="bg-destructive hover:bg-destructive/80"
						onClick={async () => {
							toast.promise(deleteTag(tag), {
								loading: `Deleting #${tag}...`,
								success() {
									setDialogOpen(false);
									onDelete?.();
									return `Deleted #${tag}!`;
								},
								error: `Could not delete #${tag}.`,
							});
						}}
					>
						<TrashIcon className="size-[18px]" />
						Delete
					</AlertDialogAction>
					<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default DeleteTagButton;
