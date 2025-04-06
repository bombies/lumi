import { FieldValues } from 'react-hook-form';

import { FormDescription, FormItem, FormMessage } from '../../form';
import { Select, SelectProps } from '../../multiselect';
import EasyFormField, { EasyFormFieldProps } from '../easy-form-field';
import EasyFormLabel from './easy-form-label';

type Props<T extends FieldValues> = Pick<
	EasyFormFieldProps<T>,
	'name' | 'label' | 'labelClassName' | 'className' | 'showErrorMessage' | 'optional' | 'description'
> &
	Omit<SelectProps, 'onChange' | 'selected'>;

export default function EasyFormSelect<T extends FieldValues>({
	name,
	className,
	label,
	labelClassName,
	description,
	showErrorMessage,
	optional,
	...multiSelectProps
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
					<Select
						className={className}
						onChange={field.onChange}
						selected={field.value ?? []}
						{...multiSelectProps}
					/>
					{description && <FormDescription>{description}</FormDescription>}
					{showErrorMessage && <FormMessage />}
				</FormItem>
			)}
		/>
	);
}
