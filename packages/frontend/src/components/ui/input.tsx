import * as React from 'react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	startContent?: React.ReactNode;
	endContent?: React.ReactNode;
	inputClassName?: string;
	onValueChange?: (value: string | number) => void;
	onTypingEnd?: (value: string) => void;
	typingEndDelay?: number;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	(
		{
			className,
			type,
			startContent,
			endContent,
			inputClassName,
			onChange,
			onValueChange,
			onTypingEnd,
			typingEndDelay = 400,
			...props
		},
		ref,
	) => {
		const [isFocused, setIsFocused] = useState(false);
		const [currentValue, setCurrentValue] = useState<string>('');

		useEffect(() => {
			if (!onTypingEnd) return;

			const timeout = setTimeout(() => {
				onTypingEnd?.(currentValue);
			}, typingEndDelay);

			return () => clearTimeout(timeout);
		}, [currentValue, onTypingEnd, typingEndDelay]);

		return (
			<div
				className={cn(
					'flex items-center h-10 w-full bg-input text-foreground rounded-lg border border-primary/10 overflow-hidden',
					startContent && 'pl-3',
					endContent && 'pr-3',
					isFocused && 'focus-visible:!outline-0 ring-2 ring-primary',
					className,
				)}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
			>
				{startContent && <div className="shrink-0 self-center pr-3 text-foreground/20">{startContent}</div>}
				<input
					type={type}
					className={cn(
						'self-center w-full h-full px-3 text-sm text-foreground rounded-xl !ring-0 focus-visible:!outline-0 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground/20 disabled:cursor-not-allowed disabled:opacity-50',
						startContent && 'pl-0 pr-3',
						endContent && 'pr-0 pl-3',
						startContent && endContent && 'pr-0 pl-0',
						inputClassName,
					)}
					ref={ref}
					onChange={e => {
						if (onChange) onChange(e);
						setCurrentValue(e.target.value);
						onValueChange?.(e.target.value);
					}}
					{...props}
				/>
				{endContent && <div className="shrink-0 self-center pl-3 text-foreground/20">{endContent}</div>}
			</div>
		);
	},
);
Input.displayName = 'Input';

export { Input };
