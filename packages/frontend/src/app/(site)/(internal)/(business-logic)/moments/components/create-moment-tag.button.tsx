'use client';

import { FC, useCallback, useState } from 'react';
import { TagIcon } from '@heroicons/react/24/solid';
import { SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import EasyForm from '@/components/ui/form-extras/easy-form';
import EasyFormField from '@/components/ui/form-extras/easy-form-field';
import { Input } from '@/components/ui/input';
import { CreateRelationshipMomentTag } from '@/hooks/trpc/moment-hooks';

const momentTagCreationFormSchema = z.object({
	tag: z.string().min(1).max(50),
});

type MomentTagCreationFormSchema = z.infer<typeof momentTagCreationFormSchema>;

const CreateMomentTagButton: FC = () => {
	const [dialogOpen, setDialogOpen] = useState(false);
	const { mutateAsync: createMomentTag, isPending: isCreatingMomentTag } = CreateRelationshipMomentTag();
	const onSubmit = useCallback<SubmitHandler<MomentTagCreationFormSchema>>(
		async data => {
			toast.promise(createMomentTag({ tag: data.tag }), {
				loading: 'Creating moment tag...',
				success() {
					setDialogOpen(false);
					return 'Successfully created moment tag!';
				},
				error: 'Could not create moment tag.',
			});
		},
		[createMomentTag],
	);

	return (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
			<DialogTrigger asChild>
				<Button>
					<TagIcon className="size-[18px]" /> Create New Tag
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create Moment Tag</DialogTitle>
				</DialogHeader>
				<EasyForm
					schema={momentTagCreationFormSchema}
					onSubmit={onSubmit}
					className="space-y-6"
					submitting={isCreatingMomentTag}
				>
					<EasyFormField<MomentTagCreationFormSchema> name="tag" label="Tag">
						<Input max={50} placeholder="Enter the name of your tag" />
					</EasyFormField>
					<Button type="submit" loading={isCreatingMomentTag}>
						Create Tag
					</Button>
				</EasyForm>
			</DialogContent>
		</Dialog>
	);
};

export default CreateMomentTagButton;
