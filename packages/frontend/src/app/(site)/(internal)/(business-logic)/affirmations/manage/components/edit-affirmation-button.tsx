'use client';

import type { Affirmation } from '@lumi/core/affirmations/affirmations.types';
import type { FC } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import EasyForm from '@/components/ui/form-extras/easy-form';

import EasyFormInput from '@/components/ui/form-extras/fields/easy-form-input';
import { UpdateAffirmation } from '@/hooks/trpc/affirmation-hooks';
import { PencilIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { z } from 'zod';

type Props = {
	affirmation: Affirmation;
};

const formSchema = z.object({
	affirmation: z.string().min(1).max(150),
});

type FormSchema = z.infer<typeof formSchema>;

const EditAffirmationButton: FC<Props> = ({ affirmation }) => {
	const { mutateAsync: updateAffirmation, isPending: isUpdating } = UpdateAffirmation();
	const [dialogOpen, setDialogOpen] = useState(false);

	const onSubmit = useCallback<SubmitHandler<FormSchema>>(
		async ({ affirmation: newAffirmation }) => {
			try {
				await updateAffirmation({ id: affirmation.id, affirmation: newAffirmation });
				setDialogOpen(false);
			} catch {}
		},
		[affirmation.id, updateAffirmation],
	);

	return (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
			<DialogTrigger asChild>
				<Button variant="default:flat" size="icon">
					<PencilIcon size={18} />
				</Button>
			</DialogTrigger>
			<DialogContent
				onPointerDownOutside={(e) => {
					e.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>Edit Affirmation</DialogTitle>
				</DialogHeader>
				<EasyForm schema={formSchema} onSubmit={onSubmit} disabled={isUpdating} className="space-y-6">
					<EasyFormInput
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
					<Button type="submit" loading={isUpdating}>
						Submit
					</Button>
				</EasyForm>
			</DialogContent>
		</Dialog>
	);
};

export default EditAffirmationButton;
