'use client';

import { auth } from '@/app/auth/actions';
import { UserSubject } from '@lumi/core/auth/subjects';
import { useCallback, useEffect, useState } from 'react';

export const useSubject = () => {
	const [subject, setSubject] = useState<UserSubject | null>(null);
	const [loading, setLoading] = useState(true);

	const fetchSubject = useCallback(() => {
		auth()
			.then(subject => subject && setSubject(subject.properties))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		fetchSubject();
	}, [fetchSubject]);

	return { subject, loading, fetchSubject };
};
