import VerifyAccountForm from '@/app/(site)/auth/components/verify-account-form';
import { auth } from '@/auth';
import { generateOTPForUserId, userHasOTPPending } from '@lumi/core/auth/auth.service';
import { sendAuthCodeEmail } from '@lumi/emails/auth/code';
import { redirect } from 'next/navigation';
import { FC } from 'react';

const VerifyAccountPage: FC = async () => {
	const session = (await auth())!;

	if (session.user.verified) redirect('/');

	if (!(await userHasOTPPending(session.user.id!))) {
		const otp = await generateOTPForUserId(session.user.id!);
		await sendAuthCodeEmail({
			code: otp.code,
			email: session.user.email!,
		});
	}

	return (
		<main>
			<VerifyAccountForm />
		</main>
	);
};

export default VerifyAccountPage;
