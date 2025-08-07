import {
	addMonths,
	format,
	getDay,
	getDaysInMonth,
	getMonth,
	getYear,
	subMonths,
} from 'date-fns';

const range = (start: number, end: number): number[] => {
	return Array.from({ length: end - start }, (_, i) => start + i);
};

export const daysOfWeek = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
];

export function getYearDropdownOptions(currentYear: number, opts?: {
	maxOffset?: number;
	minOffset?: number;
	startingYear?: number;
	endingYear?: number;
}): CalendarDropdownOptions[] {
	const minYear = opts?.startingYear ?? currentYear - Math.abs(opts?.minOffset ?? 0);
	const maxYear = opts?.endingYear ?? currentYear + Math.abs(opts?.maxOffset ?? 0);
	return range(minYear, maxYear + 1).map(y => ({ label: `${y}`, value: y }));
}

export type CalendarDropdownOptions = {
	value: number;
	label: string;
};

export function getMonthDropdownOptions(): CalendarDropdownOptions[] {
	return range(1, 13).map(m => ({
		value: m,
		label: format(new Date(2000, m - 1, 1), 'MMMM'),
	}));
}

export function getNumberOfDaysInMonth(year: number, month: number) {
	return getDaysInMonth(new Date(year, month - 1));
}

export type CalendarMonthDay = {
	dateString: string;
	dayOfMonth: number;
	isCurrentMonth: boolean;
};

export function createDaysForCurrentMonth(year: number, month: number): CalendarMonthDay[] {
	return Array.from({ length: getNumberOfDaysInMonth(year, month) })
		.map((_, index) => {
			return {
				dateString: format(new Date(year, month - 1, index + 1), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
				dayOfMonth: index + 1,
				isCurrentMonth: true,
			};
		});
}

export function createDaysForPreviousMonth(year: number, month: number, currentMonthDays: CalendarMonthDay[]): CalendarMonthDay[] {
	const firstDayOfTheMonthWeekday = getWeekday(currentMonthDays[0].dateString);
	const previousMonth = subMonths(new Date(year, month - 1, 1), 1);

	const visibleNumberOfDaysFromPreviousMonth = firstDayOfTheMonthWeekday;

	const firstDayOfCurrentMonth = new Date(year, month - 1, 1);
	const previousMonthLastMondayDate = new Date(firstDayOfCurrentMonth.getTime() - visibleNumberOfDaysFromPreviousMonth * 24 * 60 * 60 * 1000);
	const previousMonthLastMondayDayOfMonth = previousMonthLastMondayDate.getDate();

	return Array.from({ length: visibleNumberOfDaysFromPreviousMonth })
		.map((_, index) => {
			return {
				dateString: format(
					new Date(getYear(previousMonth), getMonth(previousMonth), previousMonthLastMondayDayOfMonth + index),
					'yyyy-M-d',
				),
				dayOfMonth: previousMonthLastMondayDayOfMonth + index,
				isCurrentMonth: false,
				isPreviousMonth: true,
			};
		});
}

export function createDaysForNextMonth(year: number, month: number, currentMonthDays: CalendarMonthDay[]): CalendarMonthDay[] {
	const lastDayOfTheMonthWeekday = getWeekday(
		`${year}-${month}-${currentMonthDays.length}`,
	);
	const nextMonth = addMonths(new Date(year, month - 1, 1), 1);
	const visibleNumberOfDaysFromNextMonth = 6 - lastDayOfTheMonthWeekday;

	return Array.from({ length: visibleNumberOfDaysFromNextMonth })
		.map((day, index) => {
			return {
				dateString: format(
					new Date(getYear(nextMonth), getMonth(nextMonth), index + 1),
					'yyyy-MM-dd',
				),
				dayOfMonth: index + 1,
				isCurrentMonth: false,
				isNextMonth: true,
			};
		});
}

// sunday === 0, saturday === 6
export function getWeekday(dateString: string) {
	return getDay(new Date(dateString));
}

export function isWeekendDay(dateString: string) {
	return [6, 0].includes(getWeekday(dateString));
}
