import type { Relationship } from '../relationships/relationship.types';

export const extractPartnerIdFromRelationship = (userId: string, relationship: Relationship) =>
	userId === relationship.partner1 ? relationship.partner2 : relationship.partner1;

const rtf = new Intl.RelativeTimeFormat('en', { style: 'short', numeric: 'auto' });
const dateTimeFormat = new Intl.DateTimeFormat('en', {
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
	hour12: false,
});
const timeFormat = new Intl.DateTimeFormat('en', {
	hour: '2-digit',
	minute: '2-digit',
	hour12: true,
});

// @ts-expect-error Not all the keys are present so an error is being thrown. Can safely ignore
// since not all keys are being used.
const units: Record<Intl.RelativeTimeFormatUnit, number> = {
	year: 24 * 60 * 60 * 1000 * 365,
	month: (24 * 60 * 60 * 1000 * 365) / 12,
	day: 24 * 60 * 60 * 1000,
	hour: 60 * 60 * 1000,
	minute: 60 * 1000,
	second: 1000,
};

export const getRelativeTime = (d1: Date, d2: Date = new Date()) => {
	const elapsed = +d1 - +d2;

	for (const [k, v] of Object.entries(units))
		if (Math.abs(elapsed) > v || k === 'second')
			return rtf.format(Math.round(elapsed / v), k as Intl.RelativeTimeFormatUnit);
};

export const formatTime = (date: Date, opts?: {
	noDate?: boolean;
}) => {
	const now = new Date();
	const diff = date.getTime() - now.getTime();

	if (opts?.noDate)
		return timeFormat.format(date);

	if (Math.abs(diff) < 1000 * 60 * 60 * 24) {
		return timeFormat.format(date);
	} else if (Math.abs(diff) < 1000 * 60 * 60 * 24 * 30) {
		return dateTimeFormat.format(date);
	} else {
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		});
	}
};

export const getDurationMs = (start: Date, end: Date = new Date()) => {
	const startTime = start.getTime();
	const endTime = end.getTime();

	return Math.abs(endTime - startTime);
};

export function formatDuration(duration: number | Date, opts?: {
	seconds?: boolean;
	minutes?: boolean;
	hours?: boolean;
	days?: boolean;
	months?: boolean;
}) {
	// Default all options to true if not specified
	const options = {
		seconds: opts?.seconds !== false,
		minutes: opts?.minutes !== false,
		hours: opts?.hours !== false,
		days: opts?.days !== false,
		months: opts?.months !== false,
	};

	if (duration instanceof Date) {
		duration = getDurationMs(duration);
	}

	// Hold our calculated values
	let remainingMs = duration;
	let months = 0;
	let days = 0;
	let hours = 0;
	let minutes = 0;
	let seconds = 0;

	// Calculate each unit based on whether larger units are included
	// This ensures proper remainder calculation

	// Month calculation (approximately 30 days)
	const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30;
	if (options.months) {
		months = Math.floor(remainingMs / MS_PER_MONTH);
		remainingMs %= MS_PER_MONTH;
	}

	// Day calculation
	const MS_PER_DAY = 1000 * 60 * 60 * 24;
	if (options.days) {
		days = Math.floor(remainingMs / MS_PER_DAY);
		remainingMs %= MS_PER_DAY;
	}

	// Hour calculation
	const MS_PER_HOUR = 1000 * 60 * 60;
	if (options.hours) {
		hours = Math.floor(remainingMs / MS_PER_HOUR);
		remainingMs %= MS_PER_HOUR;
	}

	// Minute calculation
	const MS_PER_MINUTE = 1000 * 60;
	if (options.minutes) {
		minutes = Math.floor(remainingMs / MS_PER_MINUTE);
		remainingMs %= MS_PER_MINUTE;
	}

	// Second calculation
	const MS_PER_SECOND = 1000;
	if (options.seconds) {
		seconds = Math.floor(remainingMs / MS_PER_SECOND);
	}

	// Build parts array with only the included units
	const parts: string[] = [];

	if (options.months && months > 0) {
		parts.push(`${months} month${months !== 1 ? 's' : ''}`);
	}

	if (options.days && days > 0) {
		parts.push(`${days} day${days !== 1 ? 's' : ''}`);
	}

	if (options.hours && hours > 0) {
		parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
	}

	if (options.minutes && minutes > 0) {
		parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
	}

	if (options.seconds && seconds > 0) {
		parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
	}

	// Handle the case when duration equals 0 or all units are excluded
	if (parts.length === 0) {
		if (options.seconds) {
			return '0 seconds';
		} else if (options.minutes) {
			return '0 minutes';
		} else if (options.hours) {
			return '0 hours';
		} else if (options.days) {
			return '0 days';
		} else if (options.months) {
			return '0 months';
		} else {
			return '0';
		}
	}

	return parts.join(', ');
}

export const convertDate = (date: Date, unit: 'years' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds') => {
	const duration = getDurationMs(date);
	switch (unit) {
		case 'years':
			return Math.floor(duration / (1000 * 60 * 60 * 24 * 365));
		case 'months':
			return Math.floor(duration / (1000 * 60 * 60 * 24 * 30));
		case 'weeks':
			return Math.floor(duration / (1000 * 60 * 60 * 24 * 7));
		case 'days':
			return Math.floor(duration / (1000 * 60 * 60 * 24));
		case 'hours':
			return Math.floor(duration / (1000 * 60 * 60));
		case 'minutes':
			return Math.floor(duration / (1000 * 60));
		case 'seconds':
			return Math.floor(duration / 1000);
		default:
			return duration;
	}
};
