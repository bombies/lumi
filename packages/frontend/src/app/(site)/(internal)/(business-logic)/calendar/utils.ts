import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { range } from 'ramda';

dayjs.extend(weekday);
dayjs.extend(weekOfYear);

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
		label: dayjs()
			.month(m - 1)
			.format('MMMM'),
	}));
}

export function getNumberOfDaysInMonth(year: number, month: number) {
	return dayjs(`${year}-${month}-01`).daysInMonth();
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
				dateString: dayjs(`${year}-${month}-${index + 1}`).format(),
				dayOfMonth: index + 1,
				isCurrentMonth: true,
			};
		});
}

export function createDaysForPreviousMonth(year: number, month: number, currentMonthDays: CalendarMonthDay[]): CalendarMonthDay[] {
	const firstDayOfTheMonthWeekday = getWeekday(currentMonthDays[0].dateString);
	const previousMonth = dayjs(`${year}-${month}-01`).subtract(1, 'month');

	const visibleNumberOfDaysFromPreviousMonth = firstDayOfTheMonthWeekday;

	const previousMonthLastMondayDayOfMonth = dayjs(
		currentMonthDays[0].dateString,
	)
		.subtract(visibleNumberOfDaysFromPreviousMonth, 'day')
		.date();

	return Array.from({ length: visibleNumberOfDaysFromPreviousMonth })
		.map((_, index) => {
			return {
				dateString: dayjs(
					`${previousMonth.year()}-${previousMonth.month() + 1}-${
						previousMonthLastMondayDayOfMonth + index
					}`,
				).format('YYYY-MM-D'),
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
	const nextMonth = dayjs(`${year}-${month}-01`).add(1, 'month');
	const visibleNumberOfDaysFromNextMonth = 6 - lastDayOfTheMonthWeekday;

	return Array.from({ length: visibleNumberOfDaysFromNextMonth })
		.map((day, index) => {
			return {
				dateString: dayjs(
					`${nextMonth.year()}-${nextMonth.month() + 1}-${index + 1}`,
				).format('YYYY-MM-DD'),
				dayOfMonth: index + 1,
				isCurrentMonth: false,
				isNextMonth: true,
			};
		});
}

// sunday === 0, saturday === 6
export function getWeekday(dateString: string) {
	return dayjs(dateString).weekday();
}

export function isWeekendDay(dateString: string) {
	return [6, 0].includes(getWeekday(dateString));
}
