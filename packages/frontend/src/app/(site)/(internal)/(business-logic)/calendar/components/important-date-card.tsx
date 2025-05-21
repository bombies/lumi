'use client';

import type { ImportantDate } from '@lumi/core/calendar/calendar.types';
import type { FC } from 'react';
import { ImportantDateType } from '@lumi/core/calendar/calendar.types';
import { formatNumberWithOrdinalSuffix } from '@lumi/core/utils/datetime';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import DeleteImportantDateButton from './delete-important-date-button';
import EditImportantDateButton from './edit-important-date-button';

type Props = {
	importantDate: ImportantDate;
	date: Date;
};

const ImportantDateCard: FC<Props> = ({ importantDate, date }) => {
	const repeatedCount = useMemo(() => {
		const currentYear = date.getFullYear();
		return currentYear - new Date(importantDate.date).getFullYear();
	}, [date, importantDate.date]);

	return (
		<Card>
			<CardHeader className="flex flex-row justify-between gap-4">
				<Badge variant="outline" className="capitalize">
					{importantDate.type !== ImportantDateType.OTHER && importantDate.annual && repeatedCount
						? `${formatNumberWithOrdinalSuffix(repeatedCount)} `
						: ''}
					{importantDate.type.toLowerCase()}
				</Badge>
				<div className="flex gap-2">
					<EditImportantDateButton importantDate={importantDate} />
					<DeleteImportantDateButton importantDate={importantDate} />
				</div>
			</CardHeader>
			<CardContent>
				<p className="text-lg font-semibold overflow-hidden overflow-ellipsis flex items-center gap-2">
					{importantDate.title}
				</p>
				{importantDate.notes && (
					<>
						<Separator className="my-2" />
						<p className="whitespace-pre-wrap">
							{importantDate.notes}
						</p>
					</>
				)}
			</CardContent>
		</Card>
	);
};

export default ImportantDateCard;
