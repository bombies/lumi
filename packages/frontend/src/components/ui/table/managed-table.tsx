import { FC, ReactElement } from 'react';
import { Column, ColumnDef, Row, RowSelectionState, Updater } from '@tanstack/react-table';

import ManagedTableDisplay from './managed-table-display';
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
	rowClassName?: (row: Row<T>) => string | undefined;
};

export const makeColumnSortable = <T,>(column: Column<T>) => {
	return column.toggleSorting(column.getIsSorted() === 'asc');
};

export default function ManagedTable<T extends { id: string }>({
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
	rowClassName,
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
				allowRowSelection={loading ? false : allowRowSelection}
				onRowSelectionChange={onRowSelectionChange}
				loading={loading}
				rowClassName={rowClassName}
			>
				{header && <div className="mb-6">{header}</div>}
				<ManagedTableDisplay className={className} />
				<ManagedTablePagination {...paginationProps} />
				{footer && <div className="mt-6">{footer}</div>}
			</ManagedTableProvider>
		</div>
	);
}
