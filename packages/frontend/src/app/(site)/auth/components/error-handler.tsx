'use client';

import { useSearchParams } from 'next/navigation';
import { FC, useEffect } from 'react';
import { toast } from 'sonner';

const ErrorHandler: FC = () => {
	useErrorHandler();
	return <></>;
};

const useErrorHandler = () => {
	const searchParams = useSearchParams();

	useEffect(() => {
		const error = searchParams.get('error');
		if (!error) return;

		let errorMessage: string;
		switch (error) {
			case 'AcessDenied': {
				errorMessage = 'Invalid credentials.';
				break;
			}
			case 'OAuthAccountNotLinked': {
				errorMessage =
					'This account is already linked to another provider. Please sign in with the correct provider.';
				break;
			}
			case 'Verification': {
				errorMessage =
					'The link you clicked is invalid or expired. Please log in again.';
				break;
			}
			case 'UserBanned': {
				errorMessage =
					'Your account has been banned. Please contact support for more information.';
				break;
			}
			default: {
				errorMessage = 'There was an error trying to sign in. Please try again.';
				break;
			}
		}

		const timeoutId = setTimeout(() => {
			toast.error(errorMessage);
		}, 1000);

		return () => clearTimeout(timeoutId);
	}, [searchParams]);
};

export default ErrorHandler;
