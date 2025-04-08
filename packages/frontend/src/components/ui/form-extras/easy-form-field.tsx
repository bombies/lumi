'use client';

import { cloneElement, ComponentPropsWithoutRef, ReactElement, useEffect } from 'react';
import { Slot } from '@radix-ui/react-slot';
import {
	ControllerFieldState,
	ControllerRenderProps,
	FieldValues,
	Path,
	PathValue,
	UseFormReturn,
	UseFormStateReturn,
} from 'react-hook-form';

import { FormControl, FormDescription, FormItem, FormLabel, FormMessage, FormField as ShadFormField } from '../form';
import { useForm } from './easy-form-provider';

export type EasyFormFieldProps<T extends FieldValues> = Readonly<{
	name: Path<T>;
	label?: string;
	children?:
		| ReactElement<ComponentPropsWithoutRef<typeof Slot>, typeof Slot>
		| ((
				form: UseFormReturn<T>,
				field: ControllerRenderProps<T, Path<T>>,
		  ) => ReactElement<ComponentPropsWithoutRef<typeof Slot>, typeof Slot>);
	showErrorMessage?: boolean;
	description?: string;
	className?: string;
	labelClassName?: string;
	optional?: boolean;
	defaultValue?: PathValue<T, Path<T>>;
	render?: ({
		field,
		fieldState,
		formState,
	}: {
		field: ControllerRenderProps<T>;
		fieldState: ControllerFieldState;
		formState: UseFormStateReturn<T>;
	}) => React.ReactElement<any>;
}>;

export default function EasyFormField<T extends FieldValues = FieldValues>({
	name,
	label,
	children,
	description,
	showErrorMessage,
	className,
	labelClassName,
	optional,
	defaultValue,
	render,
}: EasyFormFieldProps<T>) {
	const { form, submitting, disabled, requiredAsterisk } = useForm<T>();

	if (!render && !children)
		throw new Error(
			`Invalid configuration for EasyFormField with name: ${name}. You must provide either a "children" prop or a "render" prop to EasyFormField`,
		);

	useEffect(() => {
		if (defaultValue) form.setValue(name, defaultValue);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<ShadFormField
			control={form.control}
			disabled={submitting || disabled}
			name={name}
			render={({ field, fieldState, formState }) =>
				render?.({ field, formState, fieldState }) ?? (
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
						<FormControl defaultValue={defaultValue}>
							{cloneElement(typeof children === 'function' ? children(form, field) : children!, {
								...field,
								// @ts-expect-error cloneElement props types are weird.
								value: field.value ?? '',
							})}
						</FormControl>
						{description && <FormDescription>{description}</FormDescription>}
						{showErrorMessage && <FormMessage />}
					</FormItem>
				)
			}
		/>
	);
}
