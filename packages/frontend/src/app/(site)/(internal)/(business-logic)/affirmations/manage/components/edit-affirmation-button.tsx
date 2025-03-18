'use client';

import { FC, useCallback, useState } from 'react';
import { Affirmation } from '@lumi/core/types/affirmations.types';
import { PencilIcon } from 'lucide-react';
import { SubmitHandler } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import EasyForm from '@/components/ui/form-extras/easy-form';
import EasyFormField from '@/components/ui/form-extras/easy-form-field';
import { Textarea } from '@/components/ui/textarea';
import { UpdateAffirmation } from '../../hooks';

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
				onPointerDownOutside={e => {
					e.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>Edit Affirmation</DialogTitle>
				</DialogHeader>
				<EasyForm schema={formSchema} onSubmit={onSubmit} disabled={isUpdating} className="space-y-6">
					<EasyFormField<FormSchema> name="affirmation" label="Affirmation">
						<Textarea
							maxLength={150}
							defaultValue={affirmation.affirmation}
							className="resize-none"
							rows={3}
						/>
					</EasyFormField>
					<Button type="submit" loading={isUpdating}>
						Submit
					</Button>
				</EasyForm>
			</DialogContent>
		</Dialog>
	);
};

export default EditAffirmationButton;
