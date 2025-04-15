'use client';

import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import {
	ColumnDef,
	ColumnFiltersState,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	PaginationState,
	Row,
	RowData,
	RowSelectionState,
	SortingState,
	Table,
	useReactTable,
	VisibilityState,
} from '@tanstack/react-table';

import { Checkbox } from '../checkbox';

type ManagedTableGlobals<T> = {
	data: T[];
	table: Table<T>;
	columns: ColumnDef<T>[];
	paginationType?: 'server' | 'client';
	maxItemsPerPage?: number;
	hasMorePages?: boolean;
	allowRowSelection: boolean;
	loading?: boolean;
};

const ManagedTableContext = createContext<ManagedTableGlobals<any> | undefined>(undefined);

export const useManagedTableGlobals = <T,>() => {
	const context = useContext(ManagedTableContext);
	if (context === undefined) throw new Error('useEasyTableGlobals must be used within a EasyTableProvider');
	return context as ManagedTableGlobals<T>;
};

type ManagedTableProviderProps<T extends { id: string }> = PropsWithChildren<{
	data: T[];
	paginationType?: 'server' | 'client';
	hasMorePages?: boolean;
	pageCount?: number;
	maxItemsPerPage?: number;
	columns: ColumnDef<T>[];
	allowRowSelection?: boolean;
	onRowSelectionChange?: (rowSelection: RowSelectionState) => void;
	loading?: boolean;
	rowClassName?: (row: Row<T>) => string | undefined;
}>;

declare module '@tanstack/table-core' {
	interface TableMeta<TData extends RowData> {
		getRowClassName?: (row: Row<TData>) => string | undefined;
	}
}

export default function ManagedTableProvider<T extends { id: string }>({
	data,
	columns,
	paginationType,
	pageCount,
	hasMorePages,
	maxItemsPerPage,
	children,
	allowRowSelection,
	onRowSelectionChange,
	loading,
	rowClassName,
}: ManagedTableProviderProps<T>) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: maxItemsPerPage ?? 10,
	});

	useEffect(() => {
		onRowSelectionChange?.(rowSelection);
	}, [onRowSelectionChange, rowSelection]);

	const finalColumns: ColumnDef<T>[] = !allowRowSelection
		? columns
		: [
				{
					id: 'select',
					header: ({ table }) => {
						return (
							<Checkbox
								checked={
									table.getIsAllPageRowsSelected() ||
									(table.getIsSomePageRowsSelected() && 'indeterminate')
								}
								onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
								aria-label="Select all"
							/>
						);
					},
					cell: ({ row }) => {
						return (
							<Checkbox
								checked={row.getIsSelected()}
								onCheckedChange={value => row.toggleSelected(!!value)}
								aria-label="Select row"
							/>
						);
					},
					enableSorting: false,
					enableHiding: false,
				},
				...columns,
			];

	const table = useReactTable({
		data,
		columns: finalColumns,
		getCoreRowModel: getCoreRowModel(),
		getRowId: row => row.id as string,
		manualPagination: paginationType === 'server',
		pageCount,
		onPaginationChange: setPagination,
		getPaginationRowModel: paginationType === 'client' ? getPaginationRowModel() : undefined,
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		enableRowSelection: allowRowSelection ?? false,
		onRowSelectionChange: setRowSelection,
		onColumnVisibilityChange: setColumnVisibility,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			pagination,
		},
		meta: {
			getRowClassName: rowClassName,
		},
	});

	return (
		<ManagedTableContext.Provider
			value={{
				data,
				table,
				columns,
				maxItemsPerPage,
				hasMorePages,
				paginationType,
				allowRowSelection: allowRowSelection ?? false,
				loading,
			}}
		>
			{children}
		</ManagedTableContext.Provider>
	);
}
