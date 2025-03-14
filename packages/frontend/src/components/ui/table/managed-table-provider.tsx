'use client';

import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';
import {
	ColumnDef,
	ColumnFiltersState,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	PaginationState,
	RowSelectionState,
	SortingState,
	Table,
	Updater,
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

export const useEasyTableGlobals = <T,>() => {
	const context = useContext(ManagedTableContext);
	if (context === undefined) throw new Error('useEasyTableGlobals must be used within a EasyTableProvider');
	return context as ManagedTableGlobals<T>;
};

type ManagedTableProviderProps<T> = PropsWithChildren<{
	data: T[];
	paginationType?: 'server' | 'client';
	hasMorePages?: boolean;
	pageCount?: number;
	maxItemsPerPage?: number;
	columns: ColumnDef<T>[];
	allowRowSelection?: boolean;
	onRowSelectionChange?: (rowSelection: Updater<RowSelectionState>) => void;
	loading?: boolean;
}>;

export default function ManagedTableProvider<T>({
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
}: ManagedTableProviderProps<T>) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState({});

	const finalColumns = useMemo(() => {
		if (!allowRowSelection) return columns;

		return [
			{
				id: 'select',
				header: ({ table }) => (
					<Checkbox
						checked={
							table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
						}
						onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
						aria-label="Select all"
					/>
				),
				cell: ({ row }) => (
					<Checkbox
						checked={row.getIsSelected()}
						onCheckedChange={value => row.toggleSelected(!!value)}
						aria-label="Select row"
					/>
				),
				enableSorting: false,
				enableHiding: false,
			},
			...columns,
		];
	}, [allowRowSelection, columns]);

	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: maxItemsPerPage ?? 10,
	});

	const table = useReactTable({
		data,
		columns: finalColumns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: paginationType === 'server',
		pageCount,
		onPaginationChange: setPagination,
		getPaginationRowModel: paginationType === 'client' ? getPaginationRowModel() : undefined,
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		onRowSelectionChange: rowSelection => {
			setRowSelection(rowSelection);
			onRowSelectionChange?.(rowSelection);
		},
		onColumnVisibilityChange: setColumnVisibility,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			pagination,
		},
	});

	const providerValue = useMemo<ManagedTableGlobals<T>>(
		() => ({
			data,
			table,
			columns,
			maxItemsPerPage,
			hasMorePages,
			paginationType,
			allowRowSelection: allowRowSelection ?? false,
			loading,
		}),
		[allowRowSelection, columns, data, hasMorePages, loading, maxItemsPerPage, paginationType, table],
	);

	return <ManagedTableContext.Provider value={providerValue}>{children}</ManagedTableContext.Provider>;
}
