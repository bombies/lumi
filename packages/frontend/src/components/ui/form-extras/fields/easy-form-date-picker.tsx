'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { FieldValues } from 'react-hook-form';

import { cn } from '../../../../lib/utils';
import { Button } from '../../button';
import { Calendar } from '../../calendar';
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from '../../form';
import { Popover, PopoverContent, PopoverTrigger } from '../../popover';
import EasyFormField, { EasyFormFieldProps } from '../easy-form-field';
import { useForm } from '../easy-form-provider';

type Props<T extends FieldValues> = Pick<
	EasyFormFieldProps<T>,
	'name' | 'label' | 'labelClassName' | 'className' | 'showErrorMessage' | 'optional' | 'description'
> & {
	disabled?: (date: Date) => boolean;
};

export default function EasyFormDatePicker<T extends FieldValues>({
	name,
	className,
	label,
	labelClassName,
	description,
	showErrorMessage,
	optional,
	disabled,
}: Props<T>) {
	const { requiredAsterisk } = useForm<T>();
	return (
		<EasyFormField
			name={name}
			render={({ field }) => (
				<FormItem className={className}>
					{label && (
						<FormLabel className={labelClassName}>
							{label}{' '}
							{optional ? (
								<span className="italic text-neutral-400 text-xs">(optional)</span>
							) : (
								requiredAsterisk && <span className="text-xs text-red-500">*</span>
							)}
						</FormLabel>
					)}
					<Popover>
						<PopoverTrigger asChild>
							<FormControl>
								<Button
									variant={'outline'}
									className={cn(
										'w-[240px] pl-3 text-left font-normal',
										!field.value && 'text-muted-foreground',
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
