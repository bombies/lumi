import { Button } from '@react-email/components';
import * as React from 'react';

import EmailTemplate from '../components/template';

export default function Email() {
	return (
		<EmailTemplate>
			<Button
				href="https://example.com"
				style={{ background: '#000', color: '#fff', padding: '12px 20px' }}
			>
				Click me
			</Button>
		</EmailTemplate>
	);
}
