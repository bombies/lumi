'use client';

import type { Affirmation } from '@lumi/core/affirmations/affirmations.types';
import type { FC } from 'react';

import ManagedTable from '@/components/ui/table/managed-table';
import ManagedTableHeader from '@/components/ui/table/managed-table-header';
import { GetOwnedAffirmations } from '@/hooks/trpc/affirmation-hooks';
import AddAffirmationButton from './add-affirmation-button';
import DeleteAffirmationButton from './delete-affirmation-button';
import EditAffirmationButton from './edit-affirmation-button';

export const AffirmationsTable: FC = () => {
	const { data: affirmations, isLoading: affirmationsLoading } = GetOwnedAffirmations();

	return (
		<ManagedTable
			loading={affirmationsLoading}
			items={affirmations?.data ?? []}
			className="tablet:max-w-[45rem]"
			header={<AddAffirmationButton />}
			columns={[
				{
					id: 'affirmation',
					accessorKey: 'affirmation',
					header: ({ column }) => <ManagedTableHeader column={column} title="Affirmation" />,
					enableHiding: false,
					enableSorting: false,
				},
				{
					id: 'actions',
					accessorFn: row => row,
					header: ({ column }) => <ManagedTableHeader column={column} title="Actions" />,
					cell: ({ row, column }) => {
						const affirmation = row.getValue<Affirmation>(column.id);
						return (
							<div className="flex gap-2">
								<EditAffirmationButton affirmation={affirmation} />
								<DeleteAffirmationButton affirmation={affirmation} />
							</div>
						);
					},
					enableHiding: false,
					enableSorting: false,
				},
			]}
		/>
	);
};

export default AffirmationsTable;
