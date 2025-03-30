'use client';

import { Input } from '../input';
import { useManagedTableGlobals } from './managed-table-provider';

type Props<T> = {
	filterKey: keyof T;
	placeholder?: string;
};

export default function ManagedTableFilterInput<T>({ placeholder, filterKey }: Props<T>) {
	const { table } = useManagedTableGlobals<T>();
	return (
		<Input
			placeholder={placeholder}
			value={(table.getColumn(filterKey as string)?.getFilterValue() as string) ?? ''}
			onValueChange={value => table.getColumn(filterKey as string)?.setFilterValue(value)}
			className="max-w-sm"
		/>
	);
}
