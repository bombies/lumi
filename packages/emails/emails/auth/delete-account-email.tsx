import { sendReactEmail } from '@lumi/core/email/email.service';
import { Button, Link, Text } from '@react-email/components';
import * as React from 'react';

import EmailTemplate from '../../components/template';

export type DeleteEmailProps = {
	siteUrl: string;
};

const DeleteAccountEmail: React.FC<DeleteEmailProps> = ({ siteUrl }) => {
	return (
		<EmailTemplate preview="We have received a request to delete your account.">
			<Text>Hey,</Text>
			<Text>
				We have received a request to delete your account. Please confirm your account deletion by clicking the
				link below:
			</Text>
			<Button className="bg-[#76A34E] text-[#F8FFF1] px-4 py-2 rounded-lg cursor-pointer" href={siteUrl}>
				Confirm account deletion
			</Button>
			<Text className="text-neutral-400">
				If you didn&apos;t try to delete your account, you can ignore this email, but you should definitely
				consider changing your password.
			</Text>
		</EmailTemplate>
	);
};

export const sendAccountDeletionEmail = async ({ email, siteUrl }: DeleteEmailProps & { email: string }) => {
	return sendReactEmail({
		to: email,
		subject: 'Delete Your Lumi Account',
		body: <DeleteAccountEmail siteUrl={siteUrl} />,
	});
};

export default DeleteAccountEmail;
