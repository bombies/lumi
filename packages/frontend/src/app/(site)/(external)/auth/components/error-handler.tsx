'use client';

import type { FC } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

const useErrorHandler = () => {
	const searchParams = useSearchParams();
	let args: Parameters<typeof toast.error>[1];

	useEffect(() => {
		const error = searchParams.get('error');
		if (!error) return;

		let errorMessage: string;
		switch (error) {
			case 'AcessDenied': {
				errorMessage = 'Invalid credentials.';
				break;
			}
			case 'UserNotFound': {
				errorMessage = 'There is no user with that email or username!';
				break;
			}
			case 'OAuthAccountNotLinked': {
				errorMessage
					= 'This account is already linked to another provider. Please sign in with the correct provider.';
				break;
			}
			case 'Verification': {
				errorMessage = 'The link you clicked is invalid or expired. Please log in again.';
				break;
			}
			case 'UserBanned': {
				errorMessage = 'Your account has been banned. Please contact support for more information.';
				break;
			}
			case 'InvalidToken': {
				errorMessage = 'The token you provided is invalid.';
				break;
			}
			case 'ExpiredToken': {
				errorMessage = 'The token you provided has expired. Check your email for a new one.';
				break;
			}
			case 'InternalServerError': {
				errorMessage = 'An internal server error occurred. Please try again later.';
				break;
			}
			case 'UsernameAlreadyExists': {
				errorMessage = 'The username you provided is already taken.';
				break;
			}
			default: {
				errorMessage = error;
				break;
			}
		}

		const timeoutId = setTimeout(() => {
			toast.error(errorMessage, args);
		}, 1000);

		return () => clearTimeout(timeoutId);
	}, [args, searchParams]);
};

const ErrorHandler: FC = () => {
	useErrorHandler();
	return <></>;
};

export default ErrorHandler;
