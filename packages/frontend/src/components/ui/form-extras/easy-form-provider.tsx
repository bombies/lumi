'use client';

import { createContext, PropsWithChildren, useContext, useMemo } from 'react';
import { FieldValues, UseFormReturn } from 'react-hook-form';

type ContextValues<T extends FieldValues = any> = {
	form: UseFormReturn<T>;
	submitting?: boolean;
	disabled?: boolean;
	requiredAsterisk: boolean;
};

const FormContext = createContext<ContextValues | undefined>(undefined);

type Props<T extends FieldValues> = PropsWithChildren<{
	form: UseFormReturn<T>;
	formDisabled?: boolean;
	submitting?: boolean;
	requiredAsterisk?: boolean;
}>;

export default function EasyFormProvider<T extends FieldValues>({
	children,
	form,
	formDisabled,
	submitting,
	requiredAsterisk = false,
}: Props<T>) {
	const value = useMemo(
		() => ({
			form,
			submitting,
			disabled: formDisabled,
			requiredAsterisk,
		}),
		[form, formDisabled, requiredAsterisk, submitting],
	);

	return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

export const useForm = <T extends FieldValues>() => {
	const context = useContext(FormContext) as ContextValues<T> | undefined;
	if (!context) throw new Error('useForm must be used within a FormProvider');
	return context;
};
