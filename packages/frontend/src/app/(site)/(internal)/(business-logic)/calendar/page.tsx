import type { FC } from 'react';
import Title from '@/components/ui/title';
import AddImportantDateButton from './components/add-important-date-button';
import ImportantDateCalendar from './components/calendar';

const CalendarPage: FC = () => {
	return (
		<>
			<Title>Important Dates</Title>
			<AddImportantDateButton />
			<ImportantDateCalendar />
		</>
	);
};

export default CalendarPage;
