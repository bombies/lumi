'use client';

import { Button } from '@/components/ui/button';
import EasyForm from '@/components/ui/form-extras/easy-form';
import EasyFormField from '@/components/ui/form-extras/easy-form-field';
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from '@/components/ui/input-otp';
import { trpc } from '@/lib/trpc/client';
import { handleTrpcError } from '@/lib/trpc/utils';
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useRef } from 'react';
import { SubmitHandler } from 'react-hook-form';
import { z } from 'zod';

const verifyAccountSchema = z.object({
	code: z.string().min(6, 'The OTP must be 6 characters.'),
});

type VerifyAccountSchema = z.infer<typeof verifyAccountSchema>;

const VerifyAccountForm: FC = () => {
	const { data: session, update: updateSession } = useSession();
	const { mutateAsync: verifyOTP, isPending: isVerifying } = VerifyOTP();
	const { mutateAsync: resendOTP, isPending: isResending } = ResendOTP();
	const router = useRouter();
	const submitButtonRef = useRef<HTMLButtonElement>(null);

	const onSubmit = useCallback<SubmitHandler<VerifyAccountSchema>>(async ({ code }) => {
		try {
			await verifyOTP(code);
			await updateSession({
				...session,
				user: {
					...session?.user,
					verified: true,
				},
			});
			router.push('/');
		} catch {
			handleTrpcError(code);
		}
	}, []);

	return (
		<EasyForm
			schema={verifyAccountSchema}
			disabled={isVerifying || isResending}
			onSubmit={onSubmit}
			className="max-w-96 space-y-6"
		>
			<EasyFormField<VerifyAccountSchema> name="code" label="OTP">
				<InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS_AND_CHARS}>
					<InputOTPGroup>
						<InputOTPSlot index={0} />
						<InputOTPSlot index={1} />
						<InputOTPSlot index={2} />
					</InputOTPGroup>
					<InputOTPSeparator />
					<InputOTPGroup>
						<InputOTPSlot index={3} />
						<InputOTPSlot index={4} />
						<InputOTPSlot index={5} />
					</InputOTPGroup>
				</InputOTP>
			</EasyFormField>
			<p
				onClick={() => {
					if (!isResending && !isVerifying) resendOTP();
				}}
			>
				Request new code
			</p>
			<Button
				type="submit"
				ref={submitButtonRef}
				disabled={isResending || isVerifying}
			>
				Submit
			</Button>
		</EasyForm>
	);
};

const VerifyOTP = () => trpc.auth.verifyOTP.useMutation();
const ResendOTP = () => trpc.auth.sendOTP.useMutation();

export default VerifyAccountForm;
