'use client';

import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import { useSession } from 'next-auth/react';
import { SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';
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
		onSuccess() {
			toast.success('Account verified successfully.');
		},
		onError: e => handleTrpcError(e, 'Could not verify the account.'),
	});
const ResendOTP = (onSucess?: () => void) =>
	trpc.auth.sendOTP.useMutation({
		onSuccess() {
			toast.success('OTP re-sent successfully.');
			onSucess?.();
		},
		onError(error) {
			handleTrpcError(error, 'Could not resend the OTP.');
		},
	});

type Props = {
	otpExpired?: boolean;
};

const VerifyAccountForm: FC<Props> = ({ otpExpired }) => {
	const [isOtpExpired, setIsOtpExpired] = useState(otpExpired ?? false);
	const [expiredToastId, setExpiredToastId] = useState<string | number | null>(null);
	const { data: session, update: updateSession } = useSession();
	const { mutateAsync: verifyOTP, isPending: isVerifying } = VerifyOTP();
	const { mutateAsync: resendOTP, isPending: isResending } = ResendOTP(() => {
		setIsOtpExpired(false);
	});
	const router = useRouter();
	const submitButtonRef = useRef<HTMLButtonElement>(null);

	const onSubmit = useCallback<SubmitHandler<VerifyAccountSchema>>(
		async ({ code }) => {
			await verifyOTP(code);
			await updateSession({
				...session,
				user: {
					...session?.user,
					verified: true,
				},
			});
			router.push('/');
		},
		[router, session, updateSession, verifyOTP],
	);

	useEffect(() => {
		let timeOutId: NodeJS.Timeout | undefined = undefined;
		if (!isOtpExpired && expiredToastId) {
			toast.dismiss(expiredToastId);
			setExpiredToastId(null);
			timeOutId = setTimeout(
				() => {
					setIsOtpExpired(true);
				},
				5 * 60 * 1000,
			);
		}

		return () => clearTimeout(timeOutId);
	}, [expiredToastId, isOtpExpired]);

	useEffect(() => {
		let timeOutId: NodeJS.Timeout | undefined = undefined;
		if (isOtpExpired && !expiredToastId) {
			timeOutId = setTimeout(() => {
				const toastId = toast('Your OTP has expired. Please request a new one.', {
					action: {
						label: 'Send OTP',
						onClick: () => {
							if (!isResending && !isVerifying) resendOTP();
						},
					},
					duration: Infinity,
				});
				setExpiredToastId(toastId);
			}, 1000);
		}

		return () => clearTimeout(timeOutId);
	}, [expiredToastId, isOtpExpired, isResending, isVerifying, resendOTP]);

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
					if (!isResending && !isVerifying) resendOTP().then(() => setIsOtpExpired(false));
				}}
			>
				Didn&apos;t get the code? <span className="text-secondary dark:text-accent">Resend code</span>.
			</button>
			<Button type="submit" ref={submitButtonRef} loading={isResending || isVerifying}>
				Submit
			</Button>
		</EasyForm>
	);
};

export default VerifyAccountForm;
