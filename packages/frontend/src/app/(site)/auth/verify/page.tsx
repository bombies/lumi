import { FC } from 'react';
import { redirect } from 'next/navigation';
import { generateOTPForUserId, userHasOTPPending } from '@lumi/core/auth/auth.service';
import { sendAuthCodeEmail } from '@lumi/emails/auth/code';

import VerifyAccountForm from '@/app/(site)/auth/components/verify-account-form';
import { auth } from '@/auth';

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

	return <VerifyAccountForm />;
};

export default VerifyAccountPage;
