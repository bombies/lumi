'use client';

import type { SubmitHandler } from 'react-hook-form';
import { useCallback, useState } from 'react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import EasyForm from '@/components/ui/form-extras/easy-form';
import EasyFormInput from '@/components/ui/form-extras/fields/easy-form-input';
import { CreateAffirmation } from '@/hooks/trpc/affirmation-hooks';

const affirmationFormSchema = z.object({
	affirmation: z.string().min(1).max(150),
});

type AffirmationFormSchema = z.infer<typeof affirmationFormSchema>;

const AddAffirmationButton = () => {
	const [dialogOpen, setDialogOpen] = useState(false);
	const { mutateAsync: createAffirmation, isPending: isCreating } = CreateAffirmation();

	const onSubmit = useCallback<SubmitHandler<AffirmationFormSchema>>(
		async ({ affirmation }) => {
			try {
				await createAffirmation({ affirmation });
				setDialogOpen(false);
			} catch {}
		},
		[createAffirmation],
	);

	return (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
			<DialogTrigger asChild>
				<Button>Add Affirmation</Button>
			</DialogTrigger>
			<DialogContent
				onPointerDownOutside={(e) => {
					e.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>Add Affirmation</DialogTitle>
				</DialogHeader>
				<EasyForm
					schema={affirmationFormSchema}
					onSubmit={onSubmit}
					disabled={isCreating}
					className="space-y-6"
				>
					<EasyFormInput<AffirmationFormSchema>
						type="textarea"
						name="affirmation"
						label="Affirmation"
						inputProps={{
							maxLength: 150,
							placeholder: 'Enter your affirmation',
							className: 'resize-none',
							rows: 3,
						}}
					/>
					<Button type="submit" loading={isCreating}>
						Submit
					</Button>
				</EasyForm>
			</DialogContent>
		</Dialog>
	);
};

export default AddAffirmationButton;
