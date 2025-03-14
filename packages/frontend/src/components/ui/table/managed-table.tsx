import { FC, ReactElement } from 'react';
import { Column, ColumnDef, RowSelectionState, Updater } from '@tanstack/react-table';

import EasyTableDisplay from './managed-table-display';
import ManagedTablePagination, { ManagedTablePaginationProps } from './managed-table-pagination';
import ManagedTableProvider from './managed-table-provider';

type Props<T> = {
	items: T[];
	className?: string;
	paginationType?: 'server' | 'client';
	paginationProps?: ManagedTablePaginationProps;
	pageCount?: number;
	maxItemsPerPage?: number;
	hasMorePages?: boolean;
	columns: ColumnDef<T>[];
	caption?: string;
	header?: ReactElement<any>;
	footer?: ReactElement<any>;
	allowRowSelection?: boolean;
	onRowSelectionChange?: (rowSelection: Updater<RowSelectionState>) => void;
	loading?: boolean;
};

export const makeColumnSortable = <T,>(column: Column<T>) => {
	return column.toggleSorting(column.getIsSorted() === 'asc');
};

export default function ManagedTable<T>({
	items,
	className,
	paginationType,
	pageCount,
	hasMorePages,
	paginationProps,
	maxItemsPerPage,
	columns,
	header,
	footer,
	allowRowSelection,
	onRowSelectionChange,
	loading,
}: Readonly<Props<T>>): ReturnType<FC<T>> {
	return (
		<div>
			<ManagedTableProvider
				data={items}
				paginationType={paginationType}
				maxItemsPerPage={maxItemsPerPage}
				pageCount={pageCount}
				hasMorePages={hasMorePages}
				columns={columns}
				allowRowSelection={allowRowSelection}
				onRowSelectionChange={onRowSelectionChange}
				loading={loading}
			>
				{header}
				<EasyTableDisplay className={className} />
				<ManagedTablePagination {...paginationProps} />
				{footer}
			</ManagedTableProvider>
		</div>
	);
}
