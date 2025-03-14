'use client';

import { Button } from '../button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '../dropdown-menu';
import { useEasyTableGlobals } from './managed-table-provider';

export default function ManagedTableVisibleColumnsDropdown<T>() {
	const { table } = useEasyTableGlobals<T>();
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="default:flat">Columns</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{table
					.getAllColumns()
					.filter(column => column.getCanHide())
					.map(column => {
						return (
							<DropdownMenuCheckboxItem
								key={column.id}
								className="capitalize"
								checked={column.getIsVisible()}
								onCheckedChange={value => column.toggleVisibility(!!value)}
							>
								{column.id}
							</DropdownMenuCheckboxItem>
						);
					})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
