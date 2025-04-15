'use client';

import { ReactElement } from 'react';
import { Table } from '@tanstack/react-table';

import { useManagedTableGlobals } from './managed-table-provider';

type Props<T> = {
	children: (table: Table<T>) => ReactElement<any>;
};

export default function EasyTableHandler<T>({ children }: Props<T>) {
	const { table } = useManagedTableGlobals<T>();
	return children(table);
}
