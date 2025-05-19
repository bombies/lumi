'use client';

import type { ImportantDate } from '@lumi/core/calendar/calendar.types';
import type { FC } from 'react';
import type { CalendarMonthDay } from '../utils';
import { formatNumberWithOrdinalSuffix } from '@lumi/core/utils/datetime';
import clsx from 'clsx';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type Props = {
	importantDates: ImportantDate[];
	day: CalendarMonthDay;
};

const CalendarDay: FC<Props> = ({ importantDates, day }) => {
	const date = useMemo(() => {
		const date = new Date(day.dateString);
		date.setHours(0, 0, 0, 0);
		return date;
	}, [day.dateString]);

	const isToday = useMemo(() => {
		const today = new Date();
		return date.getFullYear() === today.getFullYear()
			&& date.getMonth() === today.getMonth()
			&& date.getDate() === today.getDate();
	}, [date]);

	return (
		<Dialog>
			<DialogTrigger asChild disabled={!importantDates.length}>
				<button
					type="button"
					id={isToday ? 'calendar_day_today' : undefined}
					className={clsx(
						'min-h-[8rem] tablet:min-h-[5rem] bg-secondary/10 border-primary ease-in-out p-2 border-x border-b tablet:border-0 duration-300 tablet:border-b-1',
						(importantDates.length && day.isCurrentMonth) && 'cursor-pointer hover:bg-primary/30',
					)}
				>
					{day.isCurrentMonth && (
						<div className="flex flex-col h-full">
							<div
								className="tablet:bg-primary/0 font-semibold text-xl phone:text-medium tablet:justify-center flex flex-col"
							>
								<p className={clsx('items-center flex flex-wrap gap-2', isToday && 'text-primary')}>
									{day.dayOfMonth}
									{' '}
									{isToday && <Badge>TODAY</Badge>}
									{importantDates.length
										? (
												<Badge>{importantDates.length}</Badge>
											)
										: undefined}
								</p>
								<Separator className="tablet:hidden my-1.5" />
							</div>
							{
								importantDates.length
									? (
											<>
												<div className="space-y-2 my-2 hidden tablet:block">
													{
														importantDates.slice(0, Math.min(importantDates.length, 2))
															.map((importantDate) => {
																const currentYear = date.getFullYear();
																const repeatedCount = currentYear - new Date(importantDate.date).getFullYear();
																return (
																	<div
																		key={importantDate.id}
																		className={cn(
																			'bg-primary/10 border border-primary/60 py-1 px-1 rounded-[6px]',
																		)}
																	>

																		<p className="text-xs font-semibold line-clamp-3 text-left">
																			{importantDate.annual && repeatedCount
																				? (
																						<span
																							className="flex justify-center items-center rounded-t-[4px] p-1 mb-1 bg-primary h-fit text-[8px]"
																						>
																							{formatNumberWithOrdinalSuffix(repeatedCount)}
																						</span>
																					)
																				: undefined}
																			{importantDate.title}
																		</p>
																	</div>
																);
															})
													}
												</div>
												<div className="flex justify-center tablet:hidden">
													<span className="w-3 h-3 bg-primary/30 rounded-full"></span>
												</div>
											</>
										)
									: undefined
							}
						</div>
					)}
				</button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{new Date(day.dateString).toLocaleDateString('en-US', {
							dateStyle: 'full',
						})}
					</DialogTitle>
					<Separator className="my-2" />
				</DialogHeader>
				<div className="space-y-6">
					<p className="text-xl font-semibold bg-primary py-1 px-6 rounded-sm w-fit">
						{importantDates.length}
						{' '}
						Date
						{importantDates.length > 1 ? 's' : ''}
					</p>
					<div className="border border-border rounded-md space-y-2 p-4">
						{importantDates.map((importantDate) => {
							const currentYear = date.getFullYear();
							const repeatedCount = currentYear - new Date(importantDate.date).getFullYear();
							return (
								<div
									key={importantDate.id}
									className="bg-primary/10 border border-primary/60 py-1 px-4 rounded-sm"
								>
									<p className="text-lg font-semibold overflow-hidden overflow-ellipsis flex items-center gap-2">
										{importantDate.annual && repeatedCount
											? (
													<span
														className="flex justify-center items-center rounded-full py-1 px-2 bg-primary text-xs"
													>
														{formatNumberWithOrdinalSuffix(repeatedCount)}
													</span>
												)
											: undefined}
										{importantDate.title}
									</p>
									{importantDate.notes && (
										<>
											<Separator className="my-2" />
											<p>
												{importantDate.notes}
											</p>
										</>
									)}
								</div>
							);
						})}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default CalendarDay;
