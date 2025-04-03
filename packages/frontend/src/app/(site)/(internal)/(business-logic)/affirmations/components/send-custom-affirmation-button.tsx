'use client';

import { FC, useCallback, useState } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { sendCustomAffirmationDto } from '@lumi/core/affirmations/affirmations.dto';
import { SubmitHandler } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import EasyForm from '@/components/ui/form-extras/easy-form';
import EasyFormField from '@/components/ui/form-extras/easy-form-field';
import { Textarea } from '@/components/ui/textarea';
import { SendCustomAffirmation } from '@/hooks/trpc/affirmation-hooks';

const customAffirmationFormSchema = sendCustomAffirmationDto;
type CustomAffirmationFormSchema = z.infer<typeof customAffirmationFormSchema>;

const SendCustomAffirmationButton: FC = () => {
	const [dialogOpen, setDialogOpen] = useState(false);
	const { mutateAsync: sendAffirmation, isPending: isSending } = SendCustomAffirmation();

	const onSubmit = useCallback<SubmitHandler<CustomAffirmationFormSchema>>(
		async ({ affirmation }) => {
			try {
				await sendAffirmation({ affirmation });
				setDialogOpen(false);
			} catch {}
		},
		[sendAffirmation],
	);

	return (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
			<DialogTrigger asChild>
				<Button variant="default:flat" className="w-fit">
					<PaperAirplaneIcon className="size-[18px]" /> Send Custom Affirmation Now
				</Button>
			</DialogTrigger>
			<DialogContent
				onPointerDownOutside={e => {
					e.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>Send Affirmation Now</DialogTitle>
					<DialogDescription>
						Enter an affirmation you wish to send to your partner at this very point in time. This
						affirmation will be persisted in the list of affirmations they&apos;ve received so make sure
						it&apos;s meaningful!
					</DialogDescription>
				</DialogHeader>
				<EasyForm
					schema={customAffirmationFormSchema}
					onSubmit={onSubmit}
					disabled={isSending}
					className="space-y-6"
				>
					<EasyFormField<CustomAffirmationFormSchema> name="affirmation" label="Affirmation">
						<Textarea
							maxLength={150}
							placeholder="Enter your affirmation"
							className="resize-none"
							rows={3}
						/>
					</EasyFormField>
					<Button type="submit" loading={isSending}>
						<PaperAirplaneIcon className="size-[18px]" /> Send Affirmation
					</Button>
				</EasyForm>
			</DialogContent>
		</Dialog>
	);
};

export default SendCustomAffirmationButton;
