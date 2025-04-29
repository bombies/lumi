'use client';

import type { FC } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import EasyForm from '@/components/ui/form-extras/easy-form';
import EasyFormField from '@/components/ui/form-extras/easy-form-field';

import { Input } from '@/components/ui/input';
import { CreateRelationshipMomentTag } from '@/hooks/trpc/moment-hooks';
import { TagIcon } from '@heroicons/react/24/solid';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

const momentTagCreationFormSchema = z.object({
	tag: z.string().min(1).max(50),
});

type MomentTagCreationFormSchema = z.infer<typeof momentTagCreationFormSchema>;

type Props = {
	disabled?: boolean;
};

const CreateMomentTagButton: FC<Props> = ({ disabled }) => {
	const [dialogOpen, setDialogOpen] = useState(false);
	const { mutateAsync: createMomentTag, isPending: isCreatingMomentTag } = CreateRelationshipMomentTag();
	const onSubmit = useCallback<SubmitHandler<MomentTagCreationFormSchema>>(
		async (data) => {
			toast.promise(createMomentTag({ tag: data.tag }), {
				loading: 'Creating moment tag...',
				success() {
					setDialogOpen(false);
					return 'Successfully created moment tag!';
				},
				error: e => e.message.message ?? 'Could not create moment tag.',
			});
		},
		[createMomentTag],
	);

	return (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
			<DialogTrigger asChild>
				<Button disabled={disabled}>
					<TagIcon className="size-[18px]" />
					{' '}
					Create New Tag
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create Moment Tag</DialogTitle>
				</DialogHeader>
				<EasyForm schema={momentTagCreationFormSchema} className="space-y-6" submitting={isCreatingMomentTag}>
					{form => (
						<>
							<EasyFormField<MomentTagCreationFormSchema> name="tag" label="Tag">
								<Input max={50} placeholder="Enter the name of your tag" />
							</EasyFormField>
							<Button
								type="button"
								loading={isCreatingMomentTag}
								onClick={() => {
									onSubmit(form.getValues());
								}}
							>
								Create Tag
							</Button>
						</>
					)}
				</EasyForm>
			</DialogContent>
		</Dialog>
	);
};

export default CreateMomentTagButton;
