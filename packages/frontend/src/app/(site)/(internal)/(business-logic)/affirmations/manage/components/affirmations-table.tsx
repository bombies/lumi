'use client';

import { FC } from 'react';
import { Affirmation } from '@lumi/core/types/affirmations.types';

import ManagedTable from '@/components/ui/table/managed-table';
import ManagedTableHeader from '@/components/ui/table/managed-table-header';
import { GetOwnedAffirmations } from '../../hooks';
import AddAffirmationButton from './add-affirmation-button';
import DeleteAffirmationButton from './delete-affirmation-button';
import EditAffirmationButton from './edit-affirmation-button';

export const AffirmationsTable: FC = () => {
	const { data: affirmations, isLoading: affirmationsLoading } = GetOwnedAffirmations();

	return (
		<ManagedTable
			loading={affirmationsLoading}
			items={affirmations ?? []}
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
