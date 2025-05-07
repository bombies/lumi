'use client';

import type { FC } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useRelationship } from '@/components/providers/relationships/relationship-provder';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import EasyForm from '@/components/ui/form-extras/easy-form';
import EasyFormDatePicker from '@/components/ui/form-extras/fields/easy-form-date-picker';
import { UpdateRelationship } from '@/hooks/trpc/relationship-hooks';
import { useCallback } from 'react';
import { toast } from 'sonner';
import z from 'zod';

const formSchema = z.object({
	date: z.date(),
});

type FormSchema = z.infer<typeof formSchema>;

const ChangeAnniversaryDateButton: FC = () => {
	const { relationship } = useRelationship();
	const { mutateAsync: updateRelationship, isPending: isUpdating } = UpdateRelationship();
	const onSubmit = useCallback<SubmitHandler<FormSchema>>(async ({ date }) => {
		toast.promise(updateRelationship({
			anniversary: date.toISOString(),
		}), {
			loading: 'Updating anniversary date...',
			success: 'Anniversary date updated!',
			error: 'Failed to update anniversary date.',
		});
	}, [updateRelationship]);

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="link" className="text-xs text-muted hover:underline">Change anniversary date</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Change Anniversary Date</DialogTitle>
				</DialogHeader>
				<EasyForm<FormSchema>
					schema={formSchema}
					onSubmit={onSubmit}
					disabled={isUpdating}
					className="space-y-6"
				>
					{() => (
						<>
							<EasyFormDatePicker<FormSchema>
								name="date"
								label="New Date"
								hideNavigation
								captionLayout="dropdown"
								defaultMonth={new Date(relationship.anniversary ?? relationship.createdAt)}
								startMonth={new Date(1900, 0)}
								endMonth={new Date(new Date().getFullYear(), 11)}
								disabled={(date) => {
									const baseDate = new Date();

									const dateOnly = new Date(
										date.getFullYear(),
										date.getMonth(),
										date.getDate(),
									);

									const currentDateOnly = new Date(
										baseDate.getFullYear(),
										baseDate.getMonth(),
										baseDate.getDate(),
									);

									return dateOnly > currentDateOnly;
								}}
							/>
							<Button type="submit" loading={isUpdating}>
								Submit
							</Button>
						</>
					)}
				</EasyForm>
			</DialogContent>
		</Dialog>
	);
};

export default ChangeAnniversaryDateButton;
