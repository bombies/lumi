'use client';

import { FC, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CogIcon, TrashIcon } from '@heroicons/react/24/solid';
import { Moment } from '@lumi/core/types/moment.types';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteMomentDetails } from '@/hooks/trpc/moment-hooks';
import { getErrorMessage } from '@/lib/trpc/utils';

type Props = {
	moment: Moment;
};

const MomentSettings: FC<Props> = ({ moment }) => {
	const router = useRouter();
	const { mutateAsync: doMomentDeletion, isPending: isDeleting } = DeleteMomentDetails();

	const deleteMoment = useCallback(async () => {
		try {
			toast.promise(doMomentDeletion({ momentId: moment.id }), {
				loading: 'Deleting moment...',
				success() {
					router.push('/moments');
					return 'Moment deleted!';
				},
				error(e) {
					return getErrorMessage(e);
				},
			});
		} catch {}
	}, [doMomentDeletion, moment.id, router]);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button className="bg-transparent text-foreground" size="icon">
					<CogIcon className="size-[18px]" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent side="left">
				<DropdownMenuLabel>Moment Settings</DropdownMenuLabel>
				<DropdownMenuItem variant="destructive" onClick={deleteMoment} disabled={isDeleting}>
					<TrashIcon className="size-[18px] mr-2" />
					Delete Moment
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default MomentSettings;
