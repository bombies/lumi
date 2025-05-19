'use client';

import type { ImportantDate } from '@lumi/core/calendar/calendar.types';
import type { FC } from 'react';
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/solid';
import { dateToMMDD, formatNumberWithOrdinalSuffix } from '@lumi/core/utils/datetime';
import { useMemo, useState } from 'react';
import { useRelationship } from '@/components/providers/relationships/relationship-provder';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GetImportantDates } from '@/hooks/trpc/calendar-hooks';
import { cn } from '@/lib/utils';
import { createDaysForCurrentMonth, createDaysForNextMonth, createDaysForPreviousMonth, daysOfWeek, getMonthDropdownOptions, getYearDropdownOptions } from '../utils';
import CalendarDay from './calendar-day';

const ImportantDateCalendar: FC = () => {
	const { relationship, partner } = useRelationship();

	const [[currentYear, currentMonth], setCurrentYearAndMonth] = useState<[number, number]>([new Date().getFullYear(), new Date().getMonth() + 1]);
	const { data: importantDates } = GetImportantDates({ startDate: new Date(currentYear, currentMonth - 1) });

	const allImportantDates = useMemo(() => {
		const flattenedDates = importantDates?.pages?.flatMap(page => page.data) ?? [];

		if (relationship.anniversary) {
			const anniversaryDate = new Date(relationship.anniversary);
			const anniverdaryDateMMDD = dateToMMDD(anniversaryDate);

			const anniversaryOffset = currentYear - anniversaryDate.getFullYear();
			if (anniversaryOffset >= 0 && anniversaryDate.getMonth() === currentMonth - 1) {
				flattenedDates.push({
					id: 'anniversary',
					date: anniversaryDate.toISOString(),
					dateMMDD: anniverdaryDateMMDD,
					annual: true,
					relationshipId: relationship.id,
					title: anniversaryOffset === 0
						? `🎊 You & ${partner.firstName} Began Your Relationship`
						: `🥂 Your ${formatNumberWithOrdinalSuffix(anniversaryOffset)} Anniversary with ${partner.firstName}`,
					createdAt: new Date().toISOString(),
				} satisfies ImportantDate);
			}
		}

		return flattenedDates;
	}, [
		currentMonth,
		currentYear,
		importantDates?.pages,
		partner.firstName,
		relationship.anniversary,
		relationship.id,
	]);

	const currentMonthDays = createDaysForCurrentMonth(currentYear, currentMonth);
	const previousMonthDays = createDaysForPreviousMonth(
		currentYear,
		currentMonth,
		currentMonthDays,
	);
	const nextMonthDays = createDaysForNextMonth(currentYear, currentMonth, currentMonthDays);
	const calendarGridDayObjects = [
		...previousMonthDays,
		...currentMonthDays,
		...nextMonthDays,
	];

	const selectMonths = useMemo(() => getMonthDropdownOptions(), []);
	const selectYears = useMemo(() => getYearDropdownOptions(new Date().getUTCFullYear(), {
		startingYear: 1900,
		endingYear: 2100,
	}), []);

	const displayPreviousMonth = () => {
		setCurrentYearAndMonth(([prevYear, prevMonth]) => {
			let nextYear = prevYear;
			let nextMonth = prevMonth - 1;

			if (nextMonth === 0) {
				nextMonth = 12;
				nextYear = prevYear - 1;
			}

			if (nextYear < 1900)
				return [prevYear, prevMonth];

			return [nextYear, nextMonth];
		});
	};

	const displayNextMonth = () => {
		setCurrentYearAndMonth(([prevYear, prevMonth]) => {
			let nextYear = prevYear;
			let nextMonth = prevMonth + 1;

			if (nextMonth === 13) {
				nextMonth = 1;
				nextYear = prevYear + 1;
			}

			if (nextYear > 2100)
				return [prevYear, prevMonth];

			return [nextYear, nextMonth];
		});
	};

	return (
		<div className="flex flex-col justify-center tablet:w-3/4 laptop:w-5/6 w-full">
			<div className="flex justify-center w-full mb-12 gap-4">
				<div className="flex justify-center tablet:w-3/4 w-full items-center gap-2">
					<Button
						size="icon"
						color="primary"
						variant="default:flat"
						className="self-center"
						onClick={displayPreviousMonth}
					>
						<ChevronDoubleLeftIcon className="size-[16px]" />
					</Button>
					<Select
						value={currentMonth.toString()}
						onValueChange={value =>
							setCurrentYearAndMonth(([year]) => [year, Number.parseInt(value)])}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select a month" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectLabel>Months</SelectLabel>
								{selectMonths.map(month => (
									<SelectItem
										key={month.value}
										value={month.value.toString()}
									>
										{month.label}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
					<Select
						value={currentYear.toString()}
						onValueChange={value =>
							setCurrentYearAndMonth(([_year, month]) => [Number.parseInt(value), month])}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select a year" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectLabel>Years</SelectLabel>
								{selectYears.map(year => (
									<SelectItem
										key={year.value}
										value={year.value.toString()}
									>
										{year.label}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
					<Button
						size="icon"
						color="primary"
						variant="default:flat"
						className="self-center"
						onClick={displayNextMonth}
					>
						<ChevronDoubleRightIcon className="size-[16px]" />
					</Button>
				</div>
			</div>
			<div className="grid-cols-7 mb-4 hidden tablet:grid">
				{daysOfWeek.map((day, i) => (
					<p
						className="text-center font-semibold"
						key={`${day}-${i}`}
					>
						{day}
					</p>
				))}
			</div>
			<div
				id="days_of_week"
				className={cn(
					'grid grid-cols-7 rounded-t-2xl  bg-primary p-2 tablet:font-semibold text-xl',
					'text-medium border-x-1 border-primary tablet:border-x-0 tablet:hidden',
				)}

			>
				{daysOfWeek.map((day, i) => (
					<p
						key={`${day}-${i}-cropped`}
						className="text-center tablet:font-semibold text-light"
					>
						{day.charAt(0)}
					</p>
				))}
			</div>
			<div
				id="days-grid"
				className="grid tablet:rounded-2xl rounded-t-none overflow-hidden grid-cols-7 border border-primary"
			>
				{
					calendarGridDayObjects.map((day) => {
						const importantDatesSubset = allImportantDates?.filter(
							(importantDate) => {
								const importantDateDate = new Date(importantDate.date);
								const dayDate = new Date(day.dateString);
								// logger.debug(`Important Date:
								// 	Annual: ${importantDate.annual}
								// 	Year: ${importantDateDate.getFullYear()}
								// 	Month: ${importantDateDate.getMonth()}
								// 	Day: ${importantDateDate.getDate()}`);
								// logger.debug(`Day Date:
								// 	Date String: ${day.dateString}
								// 	Month: ${dayDate.getMonth()}
								// 	Year: ${dayDate.getFullYear()}
								// 	Day: ${dayDate.getDate()}`);
								return importantDate.annual
									? importantDateDate.getMonth() === dayDate.getMonth()
									&& importantDateDate.getDate() === dayDate.getDate()
									: importantDateDate.getFullYear() === dayDate.getFullYear()
										&& importantDateDate.getMonth() === dayDate.getMonth()
										&& importantDateDate.getDate() === dayDate.getDate();
							},
						);
						return (
							<CalendarDay
								key={day.dateString}
								importantDates={importantDatesSubset}
								day={day}
							/>
						);
					})
				}
			</div>
		</div>
	);
};
export default ImportantDateCalendar;
