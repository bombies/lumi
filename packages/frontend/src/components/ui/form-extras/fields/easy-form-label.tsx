import type { PropsWithChildren } from 'react';
import type { FieldValues } from 'react-hook-form';

import { FormLabel } from '../../form';
import { useForm } from '../easy-form-provider';

type Props = PropsWithChildren<{
	className?: string;
	optional?: boolean;
}>;

function EasyFormLabel<T extends FieldValues>({ className, optional, children }: Props) {
	const { requiredAsterisk } = useForm<T>();
	return (
		<FormLabel className={className}>
			{children}
			{' '}
			{optional
				? (
						<span className="italic text-neutral-400 text-xs">(optional)</span>
					)
				: (
						requiredAsterisk && <span className="text-xs text-red-500">*</span>
					)}
		</FormLabel>
	);
}

export default EasyFormLabel;
