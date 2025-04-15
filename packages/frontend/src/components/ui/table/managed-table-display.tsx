'use client';

import { flexRender } from '@tanstack/react-table';

import { Skeleton } from '../skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../table';
import { useManagedTableGlobals } from './managed-table-provider';

type Props = {
	className?: string;
};

const ManagedTableDisplay = <T,>({ className }: Props) => {
	const { table, columns, loading } = useManagedTableGlobals<T>();

	const tableBody = loading ? (
		[...new Array(10).keys()].map(idx => (
			<TableRow key={`loading_row#${idx}`}>
				{columns.map(column => (
					<TableCell key={`loading_cell#${column.id}`}>
						<Skeleton className="h-4 w-[100px]" />
					</TableCell>
				))}
			</TableRow>
		))
	) : table.getRowModel().rows?.length ? (
		table.getRowModel().rows.map(row => {
			return (
				<TableRow
					key={row.id}
					className={table.options.meta?.getRowClassName?.(row)}
					data-state={row.getIsSelected() && 'selected'}
				>
					{row.getVisibleCells().map(cell => (
						<TableCell key={cell.id}>
							{loading ? (
								<Skeleton className="h-4 w-[100px]" />
							) : (
								flexRender(cell.column.columnDef.cell, cell.getContext())
							)}
						</TableCell>
					))}
				</TableRow>
			);
		})
	) : (
		<TableRow>
			<TableCell colSpan={columns.length} className="h-24 text-center">
				No results.
			</TableCell>
		</TableRow>
	);

	return (
		<div className={className}>
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map(headerGroup => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map(header => {
								return (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(header.column.columnDef.header, header.getContext())}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>{tableBody}</TableBody>
			</Table>
		</div>
	);
};

export default ManagedTableDisplay;
