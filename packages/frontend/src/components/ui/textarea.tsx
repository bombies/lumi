'use client';

import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

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
	minRows?: number;
	maxRows?: number;
	variableHeight?:
		| boolean
		| {
			maxHeight: number;
		};
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onFocus' | 'onBlur'>
& Pick<React.HTMLAttributes<HTMLDivElement>, 'onFocus' | 'onBlur'>
;

const Textarea = (
	{
		ref: forwardedRef,
		className,
		startContent,
		endContent,
		inputClassName,
		onChange,
		onValueChange,
		onTypingStart,
		onTypingEnd,
		typingEndDelay = 400,
		variableHeight,
		minRows = 1,
		maxRows,
		value,
		isTyping: controlledIsTyping,
		setIsTyping: setControlledIsTyping,
		style,
		onFocus,
		onBlur,
		...props
	}: TextareaProps & { ref?: React.Ref<HTMLTextAreaElement | null> },
) => {
	const [isFocused, setIsFocused] = useState(false);
	const [isTypingInternal, setIsTypingInternal] = useState(false);
	const internalRef = useRef<HTMLTextAreaElement>(null);
	const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const isTyping = controlledIsTyping ?? isTypingInternal;
	const setIsTyping = setControlledIsTyping ?? setIsTypingInternal;

	const hasTypingHandlers = Boolean(onTypingStart || onTypingEnd);

	const adjustHeight = useCallback(() => {
		if (!variableHeight || !internalRef.current) return;

		const textarea = internalRef.current;
		const computedStyle = window.getComputedStyle(textarea);

		// Helper to parse pixel values from computed styles
		const getPixelValue = (prop: string): number => Number.parseFloat(computedStyle.getPropertyValue(prop) || '0');

		// Extract necessary style values
		const paddingTop = getPixelValue('padding-top');
		const paddingBottom = getPixelValue('padding-bottom');
		const borderTopWidth = getPixelValue('border-top-width');
		const borderBottomWidth = getPixelValue('border-bottom-width');
		const boxSizing = computedStyle.getPropertyValue('box-sizing');

		// Calculate vertical border size
		const verticalBorder = borderTopWidth + borderBottomWidth;

		// Determine the line height, falling back to an estimate based on font size
		let lineHeight = getPixelValue('line-height');
		const fontSize = getPixelValue('font-size');
		if (Number.isNaN(lineHeight) || lineHeight === 0) {
			// If line-height is 'normal' or not explicitly set, estimate it
			lineHeight = fontSize * 1.2; // Common approximation for 'normal' line-height
		}
		// Ensure lineHeight is at least the font size
		lineHeight = Math.max(lineHeight, fontSize, 1); // Ensure it's at least 1px to avoid division by zero

		// Temporarily modify the textarea's style to measure its natural scroll height
		const originalHeight = textarea.style.height;
		const originalOverflow = textarea.style.overflowY;
		textarea.style.height = 'auto'; // Allow content to dictate height
		textarea.style.overflowY = 'hidden'; // Prevent scrollbar from influencing scrollHeight

		// Measure the scroll height (content height + vertical padding)
		const calculatedScrollHeight = textarea.scrollHeight;

		// Restore original styles immediately after measurement to prevent visual flicker
		// The final height will be applied shortly after.
		textarea.style.height = originalHeight;
		textarea.style.overflowY = originalOverflow;

		// Calculate the target height based on content + borders (for border-box)
		// For 'border-box', the 'height' style includes padding and borders.
		// 'scrollHeight' includes content and padding. So we add borders.
		let targetHeight = calculatedScrollHeight;
		if (boxSizing === 'border-box') {
			targetHeight += verticalBorder;
		}
		// Note: For 'content-box', targetHeight would theoretically just be scrollHeight,
		// as 'height' applies only to the content area. We primarily support border-box.

		// Calculate the minimum required height based on minRows
		// For 'border-box': (lines * lineHeight) + paddingTop + paddingBottom + borderTop + borderBottom
		let minBoxHeight = (lineHeight * minRows) + paddingTop + paddingBottom;
		if (boxSizing === 'border-box') {
			minBoxHeight += verticalBorder;
		}
		// Ensure minBoxHeight is at least the padding + border height, even if lineHeight is small/zero
		minBoxHeight = Math.max(minBoxHeight, paddingTop + paddingBottom + verticalBorder);

		// Determine the effective height, respecting the minimum calculated height
		let finalHeight = Math.max(targetHeight, minBoxHeight);

		let currentOverflowY = 'hidden'; // Default to hidden

		// Apply maxRows constraint
		if (maxRows && maxRows > 0 && maxRows >= minRows) {
			let maxBoxHeight = (lineHeight * maxRows) + paddingTop + paddingBottom;
			if (boxSizing === 'border-box') {
				maxBoxHeight += verticalBorder;
			}

			if (finalHeight > maxBoxHeight) {
				finalHeight = maxBoxHeight;
				currentOverflowY = 'auto'; // Show scrollbar if constrained by maxRows
			}
		}

		// Apply explicit maxHeight constraint from variableHeight object (if provided)
		if (typeof variableHeight === 'object' && variableHeight.maxHeight) {
			const explicitMaxHeight = variableHeight.maxHeight;
			if (finalHeight > explicitMaxHeight) {
				finalHeight = explicitMaxHeight;
				currentOverflowY = 'auto'; // Show scrollbar if constrained by explicit maxHeight
			}
		}

		// Set the final height and overflow styles
		// Use Math.round to avoid minor floating point differences triggering updates
		const currentHeightPx = Number.parseFloat(textarea.style.height || '0');
		if (Math.round(finalHeight) !== Math.round(currentHeightPx)) {
			textarea.style.height = `${finalHeight}px`;
			logger.debug(`Textarea height set to: ${finalHeight}px`);
		}

		// Always set overflow in case it needs to change from hidden to auto or vice-versa
		if (textarea.style.overflowY !== currentOverflowY) {
			textarea.style.overflowY = currentOverflowY;
		}
	}, [variableHeight, minRows, maxRows]); // Dependencies for the height calculation

	// Effect to run adjustHeight when relevant props change
	useEffect(() => {
		if (variableHeight) {
			// Run adjustHeight initially and whenever value or constraints change.
			// Use setTimeout to ensure styles are flushed and computed values are accurate.
			const timer = setTimeout(adjustHeight, 0);
			return () => clearTimeout(timer);
		} else {
			// If variableHeight is turned off, reset to default styles respecting props
			if (internalRef.current) {
				internalRef.current.style.height = style?.height?.toString() || 'auto';
				internalRef.current.style.overflowY = style?.overflowY?.toString() || 'auto';
			}
		}
		// Add style prop as dependency if its height/overflow might change externally
	}, [value, variableHeight, adjustHeight, minRows, maxRows, style]);

	// Effect to handle window resize events
	useEffect(() => {
		if (!variableHeight) return () => {};

		// Adjust height on resize as width changes affect text wrapping
		const handleResize = () => {
			// Consider debouncing/throttling this if performance is an issue
			adjustHeight();
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, [variableHeight, adjustHeight]); // Re-attach listener if adjustHeight function identity changes

	const handleTyping = useCallback((newValue: string, event?: React.ChangeEvent<HTMLTextAreaElement>) => {
		if (!hasTypingHandlers) return;

		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current);
		}

		// If not currently typing, trigger start handler
		if (!isTyping && event) {
			onTypingStart?.(event);
			setIsTyping(true);
		}

		// Set new timeout for typing end
		typingTimeoutRef.current = setTimeout(() => {
			onTypingEnd?.(newValue);
			setIsTyping(false);
			typingTimeoutRef.current = null;
		}, typingEndDelay);
	}, [hasTypingHandlers, isTyping, onTypingStart, setIsTyping, onTypingEnd, typingEndDelay]);

	useEffect(() => {
		return () => {
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}
		};
	}, []);

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newValue = e.target.value;
		onChange?.(e);
		onValueChange?.(newValue);
		handleTyping(newValue, e);
	};

	const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
		setIsFocused(true);
		onFocus?.(e);
	};

	const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
		setIsFocused(false);
		onBlur?.(e);
	};

	return (
		// eslint-disable-next-line jsx-a11y/click-events-have-key-events
		<div
			role="textbox"
			className={cn(
				'flex items-center w-full bg-input p-2 text-foreground rounded-lg border border-primary/10 overflow-hidden', // Wrapper styles - provides padding and border
				startContent && 'pl-0',
				endContent && 'pr-0',
				isFocused && 'focus-visible:!outline-0 ring-2 ring-primary',
				className,
			)}
			onFocus={handleFocus}
			onBlur={handleBlur}
			tabIndex={-1}
			onClick={() => internalRef.current?.focus()}
		>
			{/* Start Content */}
			{startContent && <div className="shrink-0 self-end pr-3">{startContent}</div>}

			{/* Textarea Element */}
			<textarea
				className={cn(
					'block',
					'w-full',
					'text-sm',
					'text-foreground',
					'bg-transparent',
					'resize-none',
					'!outline-none',
					'border-0',
					'p-0',
					'box-border',

					// Standard accessibility and file input styles
					'file:border-0 file:bg-transparent file:text-sm file:font-medium',
					'placeholder:text-foreground/20',
					'disabled:cursor-not-allowed disabled:opacity-50',

					inputClassName,
				)}
				ref={(elem) => {
					// Assign ref to internalRef for component logic
					internalRef.current = elem;
					// Forward ref if provided via props
					if (typeof forwardedRef === 'function') {
						forwardedRef(elem);
					} else if (forwardedRef) {
						forwardedRef.current = elem;
					}
				}}
				value={value ?? ''}
				onChange={handleChange}
				rows={minRows} // Sets initial height before JS/CSS, and fallback
				style={{
					...style,
					// Height is controlled by adjustHeight effect when variableHeight is true
					height: variableHeight ? (style?.height ?? undefined) : (style?.height ?? 'auto'),
					// Start with overflow hidden, adjustHeight manages it
					overflowY: 'hidden',
				}}
				{...props}
			/>

			{/* End Content */}
			{endContent && <div className="shrink-0 self-end pl-3">{endContent}</div>}
		</div>
	);
};

Textarea.displayName = 'Textarea';

export { Textarea };
