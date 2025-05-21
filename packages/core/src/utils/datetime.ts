export const dateToMMDD = (date: Date): string => {
	if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
		console.error('Invalid date provided to dateToMMDD');
		throw new Error('Invalid Date');
	}

	const month = date.getMonth() + 1;
	const day = date.getDate();

	const paddedMonth = month < 10 ? `0${month}` : `${month}`;
	const paddedDay = day < 10 ? `0${day}` : `${day}`;

	return `${paddedMonth}-${paddedDay}`;
};

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
