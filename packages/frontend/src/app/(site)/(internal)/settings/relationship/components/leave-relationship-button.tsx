'use client';

import { FC } from 'react';
import { useRouter } from 'next/navigation';
import { HeartOffIcon } from 'lucide-react';
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
import { LeaveRelationship } from '@/hooks/trpc/relationship-hooks';

const LeaveRelationshipButton: FC = () => {
	const { mutateAsync: leaveRelationship } = LeaveRelationship();
	const router = useRouter();
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="destructive">
					<HeartOffIcon size={18} /> Leave Relationship
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Leave Relationship</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to leave this relationship? This action cannot be undone. Doing so will
						delete all data related to your relationship (affirmations, moments, song recommendations and
						notifications).
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						className="bg-destructive hover:bg-destructive/70"
						onClick={async () => {
							toast.promise(leaveRelationship(), {
								loading: 'Leaving relationship...',
								success() {
									router.push('/join');
									return 'You have left the relationship!';
								},
								error: 'There was an error leaving the relationship.',
							});
						}}
					>
						Continue
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default LeaveRelationshipButton;
