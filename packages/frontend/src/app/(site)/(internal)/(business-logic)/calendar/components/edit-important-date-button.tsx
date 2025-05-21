'use client';

import type { ImportantDate } from '@lumi/core/calendar/calendar.types';
import type { FC } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { CakeIcon, CalendarDaysIcon, FilmIcon, HeartIcon, PencilIcon } from '@heroicons/react/24/solid';
import { ImportantDateType } from '@lumi/core/calendar/calendar.types';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import EasyForm from '@/components/ui/form-extras/easy-form';
import EasyFormCheckbox from '@/components/ui/form-extras/fields/easy-form-checkbox';
import EasyFormDatePicker from '@/components/ui/form-extras/fields/easy-form-date-picker';
import EasyFormInput from '@/components/ui/form-extras/fields/easy-form-input';
import EasyFormSelect from '@/components/ui/form-extras/fields/easy-form-select';
import { UpdateImportantDate } from '@/hooks/trpc/calendar-hooks';
import { getErrorMessage } from '@/lib/trpc/utils';

const formSchema = z.object({
	title: z.string(),
	type: z.array(z.enum(ImportantDateType)),
	annual: z.boolean().default(false),
	date: z.date(),
	notes: z.string(),
}).partial();

type FormSchema = z.infer<typeof formSchema>;

type Props = {
	importantDate: ImportantDate;
};

const EditImportantDateButton: FC<Props> = ({ importantDate }) => {
	const { mutateAsync: updateImportantDate, isPending: isUpdating } = UpdateImportantDate();
	const [dialogOpen, setDialogOpen] = useState(false);

	const onSubmit = useCallback<SubmitHandler<FormSchema>>((data) => {
		toast.promise(updateImportantDate({
			eventId: importantDate.id,
			title: data.title,
			type: data.type?.[0],
			annual: data.annual,
			date: data.date?.toISOString(),
			notes: data.notes,
		}), {
			loading: 'Updating date...',
			success: () => {
				setDialogOpen(false);
				return 'Date updated successfully!';
			},
			error: (e) => {
				return getErrorMessage(e, {
					defaultMessage: 'Failed to update date',
				});
			},
		});
	}, [importantDate.id, updateImportantDate]);

	return (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
			<DialogTrigger>
				<Button size="icon">
					<PencilIcon className="size-[16px]" />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<EasyForm
					onSubmit={onSubmit}
					schema={formSchema}
					className="space-y-6"
					disabled={isUpdating}
				>
					{() => (
						<>
							<EasyFormInput<FormSchema>
								name="title"
								label="Title"
								defaultValue={importantDate.title}
							/>
							<EasyFormSelect<FormSchema>
								name="type"
								type="single"
								defaultValue={[importantDate.type]}
								description="What would you consider the event to be?"
								options={[
									{
										value: ImportantDateType.ANNIVERSARY,
										display: 'Anniversary',
										label: (
											<p className="flex items-center gap-1">
												<HeartIcon className="size-[16px]" />
												{' '}
												Anniversary
											</p>
										),
									},
									{
										value: ImportantDateType.BIRTHDAY,
										display: 'Birthday',
										label: (
											<p className="flex items-center gap-1">
												<CakeIcon className="size-[16px]" />
												{' '}
												Birthday
											</p>
										),
									},
									{
										value: ImportantDateType.MOVIE_DATE,
										display: 'Movie Date',
										label: (
											<p className="flex items-center gap-1">
												<FilmIcon className="size-[16px]" />
												{' '}
												Movie Date
											</p>
										),
									},
									{
										value: ImportantDateType.OTHER,
										display: 'Other',
										label: (
											<p className="flex items-center gap-1">
												<CalendarDaysIcon className="size-[16px]" />
												{' '}
												Other
											</p>
										),
									},
								]}
							/>
							<EasyFormDatePicker<FormSchema>
								name="date"
								label="Date"
								hideNavigation
								captionLayout="dropdown"
								defaultMonth={new Date(importantDate.date)}
								defaultValue={new Date(importantDate.date)}
								endMonth={new Date(2100, 0)}
							/>
							<EasyFormCheckbox<FormSchema>
								name="annual"
								label="Annual"
								description="Does this event occur every year?"
								defaultValue={importantDate.annual}
							/>
							<EasyFormInput<FormSchema>
								name="notes"
								label="Notes"
								type="textarea"
								description="Enter any additional notes about this event."
								defaultValue={importantDate.notes}
							/>
							<Button type="submit" loading={isUpdating}>Edit Important Date</Button>
						</>
					)}
				</EasyForm>
			</DialogContent>
		</Dialog>
	);
};

export default EditImportantDateButton;
