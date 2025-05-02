'use client';

import type { Column } from '@tanstack/react-table';
import type { HTMLAttributes } from 'react';
import { ArrowDownIcon, ArrowUpIcon, EllipsisVerticalIcon, EyeOffIcon } from 'lucide-react';

import { cn } from '../../../lib/utils';
import { Button } from '../button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '../dropdown-menu';

type Props<TData, TValue> = HTMLAttributes<HTMLDivElement> & {
	column: Column<TData, TValue>;
	title: string;
	onSortToggle?: (value: 'asc' | 'desc') => void;
	onHideToggle?: (value: boolean) => void;
};

export default function ManagedTableHeader<TData, TValue>({
	column,
	title,
	className,
	onSortToggle,
	onHideToggle,
}: Props<TData, TValue>) {
	if (!column.getCanSort() && !column.getCanHide()) {
		return <div className={cn(className)}>{title}</div>;
	}

	return (
		<div className={cn('flex items-center space-x-2', className)}>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="sm" className="-ml-3 h-8 data-[state=open]:bg-accent/20">
						<span>{title}</span>
						{column.getIsSorted() === 'desc'
							? (
									<ArrowDownIcon className="ml-2 h-4 w-4" />
								)
							: column.getIsSorted() === 'asc'
								? (
										<ArrowUpIcon className="ml-2 h-4 w-4" />
									)
								: (
										<EllipsisVerticalIcon className="ml-2 h-4 w-4" />
									)}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="p-2">
					{column.getCanSort() && (
						<>
							<DropdownMenuItem
								onClick={() => {
									column.toggleSorting(false);
									onSortToggle?.('asc');
								}}
								className="p-2"
							>
								<ArrowUpIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
								Ascending
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									column.toggleSorting(true);
									onSortToggle?.('desc');
								}}
								className="p-2"
							>
								<ArrowDownIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
								Descending
							</DropdownMenuItem>
						</>
					)}
					{column.getCanHide() && column.getCanSort() && <DropdownMenuSeparator />}
					{column.getCanHide() && (
						<DropdownMenuItem
							onClick={() => {
								column.toggleVisibility(false);
								onHideToggle?.(false);
							}}
							className="p-2"
						>
							<EyeOffIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
							Hide
						</DropdownMenuItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
