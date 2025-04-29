'use client';

import type { FC } from 'react';
import { useEffect } from 'react';
import { scan } from 'react-scan';

const ReactScan: FC = () => {
	useEffect(() => {
		scan({
			enabled: true,
		});
	}, []);
	return <></>;
};

export default ReactScan;
