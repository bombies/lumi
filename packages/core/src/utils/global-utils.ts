import { Relationship } from '../types/relationship.types';

export const extractPartnerIdFromRelationship = (userId: string, relationship: Relationship) =>
	userId === relationship.partner1 ? relationship.partner2 : relationship.partner1;

const rtf = new Intl.RelativeTimeFormat('en', { style: 'short', numeric: 'auto' });
// @ts-ignore
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

	for (let [k, v] of Object.entries(units))
		if (Math.abs(elapsed) > v || k == 'second')
			return rtf.format(Math.round(elapsed / v), k as Intl.RelativeTimeFormatUnit);
};
