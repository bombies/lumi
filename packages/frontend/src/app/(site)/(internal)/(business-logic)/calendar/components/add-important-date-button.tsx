'use client';

import type { FC } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { CakeIcon, FilmIcon, HeartIcon } from '@heroicons/react/24/solid';
import { ImportantDateType } from '@lumi/core/calendar/calendar.types';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import EasyForm from '@/components/ui/form-extras/easy-form';
import EasyFormCheckbox from '@/components/ui/form-extras/fields/easy-form-checkbox';
import EasyFormDatePicker from '@/components/ui/form-extras/fields/easy-form-date-picker';
import EasyFormInput from '@/components/ui/form-extras/fields/easy-form-input';
import EasyFormSelect from '@/components/ui/form-extras/fields/easy-form-select';
import { CreateImportantDate } from '@/hooks/trpc/calendar-hooks';
import { getErrorMessage } from '@/lib/trpc/utils';

const formSchema = z.object({
	title: z.string(),
	type: z.array(z.enum(ImportantDateType)),
	annual: z.boolean().default(false),
	date: z.date(),
	notes: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

const AddImportantDateButton: FC = () => {
	const {
		mutateAsync: createImportantDate,
		isPending: isCreatingDate,
	} = CreateImportantDate();
	const [dialogOpen, setDialogOpen] = useState(false);

	const onSubmit = useCallback<SubmitHandler<FormSchema>>(
		async (data) => {
			toast.promise(createImportantDate({
				title: data.title,
				type: data.type[0],
				annual: data.annual,
				date: data.date.toISOString(),
				notes: data.notes,
			}), {
				loading: 'Creating event...',
				success: () => {
					setDialogOpen(false);
					return 'Event created successfully!';
				},
				error: e => getErrorMessage(e, {
					defaultMessage: 'Failed to create event',
				}),
			});
		},
		[createImportantDate],
	);

	return (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
			<DialogTrigger asChild>
				<Button>Add Important Date</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add Important Date</DialogTitle>
				</DialogHeader>
				<EasyForm
					onSubmit={onSubmit}
					className="space-y-6"
					schema={formSchema}
					disabled={isCreatingDate}
				>
					{() => (
						<>
							<EasyFormInput<FormSchema>
								name="title"
								label="Event Name"
								inputProps={{
									placeholder: 'Enter the name of the event',
								}}
							/>
							<EasyFormSelect<FormSchema>
								name="type"
								type="single"
								defaultValue={[ImportantDateType.OTHER]}
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
												<CakeIcon className="size-[16px]" />
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
								endMonth={new Date(2100, 0)}
							/>
							<EasyFormCheckbox<FormSchema>
								name="annual"
								label="Annual"
								description="Does this event occur every year?"
							/>
							<EasyFormInput<FormSchema>
								name="notes"
								label="Notes"
								type="textarea"
								description="Enter any additional notes about this event."
							/>
							<Button type="submit" loading={isCreatingDate}>Create Important Date</Button>
						</>
					)}
				</EasyForm>
			</DialogContent>
		</Dialog>
	);
};

export default AddImportantDateButton;
