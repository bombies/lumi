'use client';

import type { FieldValues } from 'react-hook-form';
import type { CalendarProps } from '../../calendar';
import type { EasyFormFieldProps } from '../easy-form-field';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../button';
import { Calendar } from '../../calendar';
import { FormControl, FormDescription, FormItem, FormMessage } from '../../form';
import { Popover, PopoverContent, PopoverTrigger } from '../../popover';
import EasyFormField from '../easy-form-field';
import EasyFormLabel from './easy-form-label';

type Props<T extends FieldValues> = Pick<
	EasyFormFieldProps<T>,
	'name' | 'label' | 'labelClassName' | 'className' | 'showErrorMessage' | 'optional' | 'description'
> & {
	disabled?: (date: Date) => boolean;
} & CalendarProps;

export default function EasyFormDatePicker<T extends FieldValues>({
	name,
	className,
	label,
	labelClassName,
	description,
	showErrorMessage,
	optional,
	disabled,
	...calendarProps
}: Props<T>) {
	return (
		<EasyFormField
			name={name}
			render={({ field }) => (
				<FormItem className={className}>
					{label && (
						<EasyFormLabel className={labelClassName} optional={optional}>
							{label}
						</EasyFormLabel>
					)}
					<Popover>
						<PopoverTrigger asChild>
							<FormControl>
								<Button
									variant="outline"
									className={cn(
										'w-[240px] pl-3 text-left font-normal',
										!field.value && 'text-muted',
									)}
								>
									{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
									<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
								</Button>
							</FormControl>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								selected={field.value}
								onSelect={field.onChange}
								disabled={disabled}
								{...calendarProps}
							/>
						</PopoverContent>
					</Popover>
					{description && <FormDescription>{description}</FormDescription>}
					{showErrorMessage && <FormMessage />}
				</FormItem>
			)}
		/>
	);
}
