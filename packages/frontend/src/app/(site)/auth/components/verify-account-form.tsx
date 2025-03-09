'use client';

import { FC, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import { useSession } from 'next-auth/react';
import { SubmitHandler } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import EasyForm from '@/components/ui/form-extras/easy-form';
import EasyFormField from '@/components/ui/form-extras/easy-form-field';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/lib/trpc/client';
import { handleTrpcError } from '@/lib/trpc/utils';

const verifyAccountSchema = z.object({
	code: z.string().min(6, 'The OTP must be 6 characters.'),
});

type VerifyAccountSchema = z.infer<typeof verifyAccountSchema>;

const VerifyOTP = () =>
	trpc.auth.verifyOTP.useMutation({
		onError: handleTrpcError,
	});
const ResendOTP = () => trpc.auth.sendOTP.useMutation();

const VerifyAccountForm: FC = () => {
	const { data: session, update: updateSession } = useSession();
	const { mutateAsync: verifyOTP, isPending: isVerifying } = VerifyOTP();
	const { mutateAsync: resendOTP, isPending: isResending } = ResendOTP();
	const router = useRouter();
	const submitButtonRef = useRef<HTMLButtonElement>(null);

	const onSubmit = useCallback<SubmitHandler<VerifyAccountSchema>>(
		async ({ code }) => {
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
		},
		[router, session, updateSession, verifyOTP],
	);

	return (
		<EasyForm
			schema={verifyAccountSchema}
			disabled={isVerifying || isResending}
			onSubmit={onSubmit}
			className="w-full max-w-[35rem] space-y-6 bg-card p-6 rounded-lg border border-border"
		>
			<h3 className="text-center font-cursive text-4xl mb-2">Verify</h3>
			<Separator className="mb-9" />
			<p>Enter the OTP sent to your email. It will expire in 5 minutes.</p>
			<div className="flex justify-center w-full">
				<EasyFormField<VerifyAccountSchema> name="code">
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
			</div>
			<button
				className="text-xs cursor-pointer block"
				onClick={() => {
					if (!isResending && !isVerifying) resendOTP();
				}}
			>
				Didn&apos;t get the code? <span className="text-secondary dark:text-accent">Resend code</span>.
			</button>
			<Button type="submit" ref={submitButtonRef} loading={isVerifying} disabled={isResending || isVerifying}>
				Submit
			</Button>
		</EasyForm>
	);
};

export default VerifyAccountForm;
