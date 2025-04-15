'use client';

import { useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from 'lucide-react';

import { Button } from '../button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import { useManagedTableGlobals } from './managed-table-provider';

export type ManagedTablePaginationProps = {
	onPageChange?: (pageIndex: number) => void;
	buttonVisibilities?: {
		first?: boolean;
		previous?: boolean;
		next?: boolean;
		last?: boolean;
	};
};

export default function ManagedTablePagination<T>({ buttonVisibilities, onPageChange }: ManagedTablePaginationProps) {
	const { maxItemsPerPage, allowRowSelection, hasMorePages, paginationType, table } = useManagedTableGlobals<T>();

	const rowsPerPageOptions = useMemo(() => {
		const defaultOptions = [10, 20, 30, 40, 50];
		if (!maxItemsPerPage) return defaultOptions;

		if (maxItemsPerPage < defaultOptions[0]) return [maxItemsPerPage];
		return defaultOptions;
	}, [maxItemsPerPage]);

	return maxItemsPerPage || paginationType ? (
		<div className="flex max-phone:flex-col items-center justify-between px-2 max-phone:mt-4">
			{allowRowSelection && (
				<div className="flex-1 text-sm text-muted-foreground">
					{table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length}{' '}
					row(s) selected.
				</div>
			)}
			<div className="max-phone:w-full flex max-phone:flex-col-reverse items-center gap-x-6 tablet:gap-x-8">
				<div className="flex items-center gap-x-2">
					<p className="text-sm font-medium">Rows per page</p>
					<Select
						value={`${table.getState().pagination.pageSize}`}
						onValueChange={val => {
							table.setPageSize(Number(val));
						}}
					>
						<SelectTrigger className="h-8 w-[70px]">
							<SelectValue placeholder={table.getState().pagination.pageSize} />
						</SelectTrigger>
						<SelectContent side="top">
							{rowsPerPageOptions.map(pageSize => (
								<SelectItem key={pageSize} value={`${pageSize}`}>
									{pageSize}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex w-[100px] items-center justify-center text-sm font-medium">
					Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
				</div>
				<div className="flex items-center gap-x-2">
					{buttonVisibilities?.first !== false && (
						<Button
							variant="default:flat"
							className="hidden h-8 w-8 p-0 tablet:flex"
							onClick={() => {
								table.setPageIndex(0);
								onPageChange?.(0);
							}}
							disabled={!table.getCanPreviousPage()}
						>
							<span className="sr-only">Go to first page</span>
							<ChevronsLeftIcon className="h-4 w-4" />
						</Button>
					)}
					{buttonVisibilities?.previous !== false && (
						<Button
							variant="default:flat"
							className="h-8 w-8 p-0"
							onClick={() => {
								table.setPageIndex(table.getState().pagination.pageIndex - 1);
								onPageChange?.(table.getState().pagination.pageIndex - 1);
							}}
							disabled={!table.getCanPreviousPage()}
						>
							<span className="sr-only">Go to previous page</span>
							<ChevronLeftIcon className="h-4 w-4" />
						</Button>
					)}
					{buttonVisibilities?.next !== false && (
						<Button
							variant="default:flat"
							className="h-8 w-8 p-0"
							onClick={() => {
								table.setPageIndex(table.getState().pagination.pageIndex + 1);
								onPageChange?.(table.getState().pagination.pageIndex + 1);
							}}
							disabled={!table.getCanNextPage() && !hasMorePages}
						>
							<span className="sr-only">Go to next page</span>
							<ChevronRightIcon className="h-4 w-4" />
						</Button>
					)}
					{buttonVisibilities?.last !== false && (
						<Button
							variant="default:flat"
							className="hidden h-8 w-8 p-0 tablet:flex"
							onClick={() => {
								table.setPageIndex(table.getPageCount() - 1);
								onPageChange?.(table.getPageCount() - 1);
							}}
							disabled={!table.getCanNextPage() && !hasMorePages}
						>
							<span className="sr-only">Go to last page</span>
							<ChevronsRightIcon className="h-4 w-4" />
						</Button>
					)}
				</div>
			</div>
		</div>
	) : undefined;
}
