'use client';

import type { ReactElement } from 'react';
import type { DefaultValues, FieldValues, SubmitHandler, UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { logger } from '@/lib/logger';
import { Form as ShadForm } from '../form';
import EasyFormProvider from './easy-form-provider';

type Props<T extends FieldValues> = {
	schema: z.ZodType<T>;
	onSubmit?: SubmitHandler<T>;
	onError?: (errors: Record<keyof T, string>) => void;
	submitting?: boolean;
	disabled?: boolean;
	className?: string;
	children:
		| ReactElement<any>
		| (ReactElement<any> | undefined)[]
		| ((form: UseFormReturn<T>) => ReactElement<any> | (ReactElement<any> | undefined)[]);
	showRequiredAsterisk?: boolean;
	clearOnSubmit?: boolean;
	initialValues?: DefaultValues<T>;
};

export default function EasyForm<T extends FieldValues>({
	children,
	schema,
	onSubmit,
	onError,
	submitting,
	disabled,
	className,
	showRequiredAsterisk = false,
	clearOnSubmit,
	initialValues,
}: Readonly<Props<T>>) {
	const form = useForm<T>({
		resolver: zodResolver(schema),
	});

	// Handle whenever an error is produced by the form
	useEffect(() => {
		const errors = form.formState.errors;
		if (Object.keys(errors).length > 0 && onError) {
			const errorMap = {} as Record<keyof T, string>;
			for (const [key, value] of Object.entries(errors))
				if (value) errorMap[key as keyof T] = value.message as string;
			onError(errorMap);
		}
	}, [form.formState.errors, onError]);

	// Set initial values if provided
	useEffect(() => {
		if (initialValues) {
			form.reset(initialValues);
		}
	}, [form, initialValues]);

	return (
		<ShadForm {...form}>
			<form
				onSubmit={
					form.handleSubmit(async (args, e) => {
						if (!onSubmit) {
							logger.debug('No onSubmit handler provided, skipping form submission!');
							return;
						}

						logger.debug('Form submitted!', form.getValues());
						const res = onSubmit(args, e);
						if (res instanceof Promise) await res;

						if (clearOnSubmit) {
							form.reset(initialValues);
							logger.debug('Form cleared after submission!', form.getValues());
						}
					})
				}
				className={className}
			>
				<EasyFormProvider
					form={form}
					submitting={submitting}
					formDisabled={disabled}
					requiredAsterisk={showRequiredAsterisk}
				>
					{typeof children === 'function' ? children(form) : children}
				</EasyFormProvider>
			</form>
		</ShadForm>
	);
}
