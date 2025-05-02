'use client';

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useState } from 'react';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

const PasswordInput: FC<Props> = ({ ...props }) => {
	const [passwordVisible, setPasswordVisible] = useState(false);
	return (
		<Input
			type={passwordVisible ? 'text' : 'password'}
			endContent={(
				<Button
					size="icon"
					variant="ghost:secondary"
					color="secondary"
					onClick={() => {
						setPasswordVisible(prev => !prev);
					}}
				>
					{passwordVisible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
				</Button>
			)}
			{...props}
		/>
	);
};

export default PasswordInput;
