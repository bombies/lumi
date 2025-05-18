'use client';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			className={cn('p-3', className)}
			classNames={{
				months: 'flex flex-col sm:flex-row gap-2',
				month: 'flex flex-col gap-4',
				month_caption: 'flex justify-center pt-1 relative items-center w-full',
				caption_label: 'text-sm font-medium',
				nav: 'flex items-center gap-1',
				button_previous: cn(
					buttonVariants({ variant: 'outline' }),
					'size-7 bg-transparent p-0 opacity-50 hover:opacity-100',
					'absolute left-1',
				),
				button_next: cn(
					buttonVariants({ variant: 'outline' }),
					'size-7 bg-transparent p-0 opacity-50 hover:opacity-100',
					'absolute right-1',
				),
				month_grid: 'w-full border-collapse space-x-1',
				weekdays: 'flex',
				weekday: 'text-muted rounded-md w-8 font-normal text-[0.8rem]',
				week: 'flex w-full mt-2',
				day: cn(
					'relative p-0 text-center rounded-md text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md',
					props.mode === 'range'
						? '[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
						: '[&:has([aria-selected])]:rounded-md',
				),
				day_button: cn(buttonVariants({ variant: 'ghost' }), 'size-8 p-0 font-normal aria-selected:opacity-100'),
				range_start: 'day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground',
				range_end: 'day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground',
				selected:
					'bg-primary text-primary-foreground hover:bg-secondary hover:text-secondary-foreground focus:bg-secondary focus:text-secondary-foreground',
				today: 'bg-accent text-accent-foreground',
				outside: 'day-outside text-muted aria-selected:text-muted',
				disabled: 'text-muted opacity-50',
				range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
				hidden: 'invisible',
				...classNames,
			}}
			components={{
				Chevron: ({ orientation, className, ...props }) => {
					return orientation === 'left'
						? (
								<ChevronLeft className={cn('size-4', className)} {...props} />
							)
						: orientation === 'right'
							? (
									<ChevronRight className={cn('size-4', className)} {...props} />
								)
							: orientation === 'up'
								? (
										<ChevronUp className={cn('size-4', className)} {...props} />
									)
								: <ChevronDown className={cn('size-4', className)} {...props} />;
				},
			}}
			{...props}
		/>
	);
}

export { Calendar };
