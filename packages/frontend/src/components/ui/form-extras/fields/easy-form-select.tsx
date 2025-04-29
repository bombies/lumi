import type { FieldValues } from 'react-hook-form';
import type { SelectProps } from '../../multiselect';

import type { EasyFormFieldProps } from '../easy-form-field';
import { useEffect, useState } from 'react';
import { FormDescription, FormItem, FormMessage } from '../../form';
import { Select } from '../../multiselect';
import EasyFormField from '../easy-form-field';
import { useForm } from '../easy-form-provider';
import EasyFormLabel from './easy-form-label';

type Props<T extends FieldValues> = Pick<
	EasyFormFieldProps<T>,
	'name' | 'label' | 'labelClassName' | 'className' | 'showErrorMessage' | 'optional' | 'description'
> &
Omit<SelectProps, 'onChange' | 'selected'> & {
	defaultValue?: string[];
};

export default function EasyFormSelect<T extends FieldValues>({
	name,
	className,
	label,
	labelClassName,
	description,
	showErrorMessage,
	optional,
	defaultValue,
	...multiSelectProps
}: Props<T>) {
	const form = useForm<T>();
	const [defaultValueInitialized, setDefaultValueInitialized] = useState(false);

	useEffect(() => {
		if (!defaultValueInitialized && defaultValue) {
			form.form.setValue(name, defaultValue as any);
			setDefaultValueInitialized(true);
		}
	}, [defaultValue, defaultValueInitialized, form.form, name]);

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
					<Select
						className={className}
						onChange={field.onChange}
						selected={field.value ?? defaultValue ?? []}
						{...multiSelectProps}
					/>
					{description && <FormDescription>{description}</FormDescription>}
					{showErrorMessage && <FormMessage />}
				</FormItem>
			)}
		/>
	);
}
