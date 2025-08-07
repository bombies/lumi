'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
	useEffect(() => {
		// Sanitize error message to prevent XSS
		const sanitizedError = {
			...error,
			message: error.message?.replace(/[<>"'&]/g, '') || 'Unknown error',
			stack: error.stack?.replace(/[<>"'&]/g, ''),
		};
		Sentry.captureException(sanitizedError);
	}, [error]);

	return (
		<html lang="en">
			<body>
				{/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
				<NextError statusCode={0} />
			</body>
		</html>
	);
}
