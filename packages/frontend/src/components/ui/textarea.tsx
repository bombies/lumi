'use client';

import { cn } from '@/lib/utils';

import * as React from 'react';

export type TextareaProps = {
	startContent?: React.ReactNode;
	endContent?: React.ReactNode;
	inputClassName?: string;
	value?: string;
	onValueChange?: (value: string) => void;
	onTypingStart?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	onTypingEnd?: (value?: string) => void;
	isTyping?: boolean;
	setIsTyping?: (isTyping: boolean) => void;
	typingEndDelay?: number;
	variableHeight?:
		| boolean
		| {
			maxHeight: number;
		};
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = (
	{ ref, className, startContent, endContent, inputClassName, onChange, onValueChange, onTypingStart, onTypingEnd, typingEndDelay = 400, variableHeight, value, isTyping: controlledIsTyping, setIsTyping: setControlledIsTyping, ...props }: TextareaProps & { ref?: React.RefObject<HTMLTextAreaElement | null> },
) => {
	const [isFocused, setIsFocused] = React.useState(false);
	const [isTyping, setIsTyping] = React.useState(false);
	const [currentValue, setCurrentValue] = React.useState<typeof value>(value);

	React.useEffect(() => {
		if (!onTypingEnd && !onTypingStart) return;

		const timeout = setTimeout(() => {
			onTypingEnd?.(currentValue);
			(setControlledIsTyping ?? setIsTyping)(false);
		}, typingEndDelay);

		return () => clearTimeout(timeout);
	}, [currentValue, onTypingEnd, onTypingStart, setControlledIsTyping, typingEndDelay]);

	React.useEffect(() => {
		setCurrentValue(value);
	}, [value]);

	return (
		<div
			className={cn(
				'flex items-center h-10 w-full bg-input p-2 text-foreground rounded-lg border border-primary/10 overflow-hidden',
				startContent && 'pl-0',
				endContent && 'pr-0',
				isFocused && 'focus-visible:!outline-0 ring-2 ring-primary',
				className,
			)}
			onFocus={() => setIsFocused(true)}
			onBlur={() => setIsFocused(false)}
		>
			{startContent && <div className="shrink-0 self-end pr-3">{startContent}</div>}
			<textarea
				className={cn(
					'self-center w-full h-full px-3 text-sm text-foreground rounded-xl !ring-0 !outline-hidden file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground/20 disabled:cursor-not-allowed disabled:opacity-50',
					startContent && 'pl-0 pr-3',
					endContent && 'pr-0 pl-3',
					startContent && endContent && 'pr-0 pl-0',
					inputClassName,
				)}
				ref={ref}
				value={currentValue ?? ''}
				onChange={(e) => {
					if (onChange) onChange(e);
					setCurrentValue(e.target.value);
					onValueChange?.(e.target.value);

					if ((onTypingStart || onTypingEnd) && !(controlledIsTyping ?? isTyping)) {
						(setControlledIsTyping ?? setIsTyping)(true);
						onTypingStart?.(e);
					}

					if (variableHeight) {
						e.target.style.height = 'auto';
						e.target.style.height
								= `${typeof variableHeight === 'object' && variableHeight.maxHeight
								? Math.min(e.target.scrollHeight, variableHeight.maxHeight)
								: e.target.scrollHeight}px`;
					}
				}}
				{...props}
			/>
			{endContent && <div className="shrink-0 self-end pl-3">{endContent}</div>}
		</div>
	);
};
Textarea.displayName = 'Textarea';

export { Textarea };
