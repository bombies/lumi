'use client';

import type { JSX } from 'react';
import type { FieldValues } from 'react-hook-form';
import type { EasyFormFieldProps } from '@/components/ui/form-extras/easy-form-field';
import type { InputProps } from '@/components/ui/input';
import type { TextareaProps } from '@/components/ui/textarea';
import { useMemo } from 'react';
import EasyFormField from '@/components/ui/form-extras/easy-form-field';
import { Input } from '@/components/ui/input';
import PasswordInput from '@/components/ui/password-input';
import { Textarea } from '@/components/ui/textarea';

type GlobalProps<T extends FieldValues> = Omit<EasyFormFieldProps<T>, 'children'>;

// Create props for each specific input type
type StringInputProps<T extends FieldValues> = GlobalProps<T> & {
	type?: 'string';
	inputProps?: InputProps;
};

type PasswordInputProps<T extends FieldValues> = GlobalProps<T> & {
	type: 'password';
	inputProps?: InputProps;
};

type TextareaInputProps<T extends FieldValues> = GlobalProps<T> & {
	type: 'textarea';
	inputProps?: TextareaProps;
};

// Create a union type that discriminates on the type field
type EasyFormInputProps<T extends FieldValues> =
	| StringInputProps<T>
	| PasswordInputProps<T>
	| TextareaInputProps<T>;

// Function overloads to provide precise typing
function EasyFormInput<T extends FieldValues>(props: StringInputProps<T>): JSX.Element;
function EasyFormInput<T extends FieldValues>(props: PasswordInputProps<T>): JSX.Element;
function EasyFormInput<T extends FieldValues>(props: TextareaInputProps<T>): JSX.Element;

// Implementation
function EasyFormInput<T extends FieldValues>({
	type = 'string',
	inputProps,
	...formFieldProps
}: EasyFormInputProps<T>) {
	const Component = useMemo(() => {
		switch (type) {
			case 'password': return PasswordInput;
			case 'textarea': return Textarea;
			default: return Input;
		}
	}, [type]);

	return (
		<EasyFormField<T> {...formFieldProps}>
			{(_form, field) => (
				<Component
					{...inputProps as any}
					{...field}
					value={field.value ?? ''}
					defaultValue={undefined}
				/>
			)}
		</EasyFormField>
	);
}

export default EasyFormInput;
