import { FC } from 'react';
import { redirect } from 'next/navigation';
import { generateOTPForUserId, getOTPForUser } from '@lumi/core/auth/auth.service';
import { sendAuthCodeEmail } from '@lumi/emails/auth/code';

import VerifyAccountForm from '@/app/(site)/(external)/auth/components/verify-account-form';
import { auth } from '@/auth';

const VerifyAccountPage: FC = async () => {
	const session = await auth();

	if (!session) return redirect('/auth/login');
	if (session?.user?.verified) redirect('/');

	let otpExpired = false;
	const currentOtp = await getOTPForUser(session!.user.id!);
	if (currentOtp) {
		if (currentOtp.expiresAt < Date.now()) otpExpired = true;
	} else {
		const otp = await generateOTPForUserId(session!.user.id!);
		await sendAuthCodeEmail({
			code: otp.code,
			email: session!.user.email!,
		});
	}

	return <VerifyAccountForm otpExpired={otpExpired} />;
};

export default VerifyAccountPage;
