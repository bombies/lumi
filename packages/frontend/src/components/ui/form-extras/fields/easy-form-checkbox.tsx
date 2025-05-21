'use client';

import type { FieldValues } from 'react-hook-form';
import type { EasyFormFieldComponentProps } from '../easy-form-field';
import { Checkbox } from '../../checkbox';
import { FormDescription, FormItem, FormMessage } from '../../form';
import EasyFormField from '../easy-form-field';
import EasyFormLabel from './easy-form-label';

type Props<T extends FieldValues> = EasyFormFieldComponentProps<T> & {
	defaultValue?: boolean;
};

export default function EasyFormCheckbox<T extends FieldValues>({
	name,
	className,
	label,
	labelClassName,
	description,
	showErrorMessage,
	optional,
	defaultValue,
}: Props<T>) {
	return (
		<EasyFormField
			name={name}
			render={({ field }) => (
				<FormItem>
					{label && (
						<EasyFormLabel className={labelClassName} optional={optional}>
							{label}
						</EasyFormLabel>
					)}
					<Checkbox
						className={className}
						defaultChecked={defaultValue}
						checked={field.value ?? defaultValue ?? false}
						onCheckedChange={field.onChange}
					/>
					{description && <FormDescription>{description}</FormDescription>}
					{showErrorMessage && <FormMessage />}
				</FormItem>
			)}
		/>
	);
};
