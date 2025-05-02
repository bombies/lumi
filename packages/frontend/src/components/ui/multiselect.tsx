'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command';
import { Skeleton } from './skeleton';

export type SelectOption = {
	value: string;
	display?: string;
	label?: React.ReactNode;
};

export type SelectProps = {
	type?: 'multi' | 'single';
	options: SelectOption[];
	optionsLoading?: boolean;
	selected: string[];
	onChange: (selected: string[]) => void;
	onSearch?: (search: string) => void;
	placeholder?: string;
	emptyText?: string;
	className?: string;
	disabled?: boolean;
	listFooter?: React.ReactNode;
	itemsFooter?: React.ReactNode;
};

export const Select: React.FC<SelectProps> = ({
	type,
	options,
	optionsLoading,
	selected,
	onChange,
	onSearch,
	placeholder = 'Select options...',
	emptyText = 'No options found.',
	className,
	disabled,
	listFooter,
	itemsFooter,
}) => {
	const [open, setOpen] = React.useState(false);

	const handleSelect = React.useCallback(
		(value: string) => {
			const updatedSelected = selected.includes(value)
				? selected.filter(item => item !== value)
				: type === 'single'
					? [value]
					: [...selected, value];
			onChange(updatedSelected);
		},
		[selected, type, onChange],
	);

	const selectedLabels = React.useMemo(
		() =>
			selected
				.map((value, idx, arr) => {
					const option = options.find(option => option.value === value);
					return (
						<React.Fragment key={`${value}#${idx}`}>
							{option?.display ?? option?.label ?? value}
							{idx < arr.length - 1 && ', '}
						</React.Fragment>
					);
				})
				.filter(Boolean),
		[selected, options],
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={cn(
						'w-full justify-between bg-input text-foreground rounded-lg border border-primary/10 hover:bg-input',
						className,
					)}
					disabled={disabled}
				>
					<span className={cn('trunacate font-normal', selected.length === 0 && 'text-foreground/20')}>
						{selected.length > 0 ? selectedLabels : placeholder}
					</span>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0">
				<Command>
					<CommandInput
						placeholder="Search options..."
						className="h-9"
						onTypingEnd={onSearch}
						typingEndDelay={300}
					/>
					<CommandList>
						{optionsLoading
							? (
									<div className="space-y-2 p-2">
										<Skeleton className="h-6 w-full" />
										<Skeleton className="h-6 w-full" />
										<Skeleton className="h-6 w-full" />
										<Skeleton className="h-6 w-full" />
										<Skeleton className="h-6 w-full" />
									</div>
								)
							: (
									<>
										<CommandEmpty>{emptyText}</CommandEmpty>
										<CommandGroup>
											{options.map(option => (
												<CommandItem
													key={option.value}
													value={option.value}
													onSelect={() => handleSelect(option.value)}
												>
													{option.label}
													<Check
														className={cn(
															'ml-auto h-4 w-4',
															selected.includes(option.value) ? 'opacity-100' : 'opacity-0',
														)}
													/>
												</CommandItem>
											))}
											{itemsFooter}
										</CommandGroup>
										{listFooter && <div className="border-t border-t-border px-2 py-2">{listFooter}</div>}
									</>
								)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
};
