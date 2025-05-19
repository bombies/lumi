import type { FC } from 'react';
import Title from '@/components/ui/title';
import ImportantDateCalendar from './components/calendar';

const CalendarPage: FC = () => {
	return (
		<>
			<Title>Important Dates</Title>
			<ImportantDateCalendar />
		</>
	);
};

export default CalendarPage;
