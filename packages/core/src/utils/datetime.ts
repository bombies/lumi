export const dateToMMDD = (date: Date) =>
	`${date.getMonth() + 1}-${date.getDate()}`;

export const startOfMonth = (date: Date = new Date()) => {
	const start = new Date(date);
	start.setDate(1);
	return start;
};

export const endOfMonth = (date: Date = new Date()) => {
	const end = new Date(date);
	end.setMonth(end.getMonth() + 1);
	end.setDate(0);
	return end;
};

export const formatNumberWithOrdinalSuffix = (num: number) => {
	if (!Number.isFinite(num)) {
		return String(num);
	}

	const intNum = Math.floor(Math.abs(num));

	const s = ['th', 'st', 'nd', 'rd'];
	const v = intNum % 100;

	const suffix = s[(v - 20) % 10] || s[v] || s[0];

	return num + suffix;
};
