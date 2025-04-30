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
