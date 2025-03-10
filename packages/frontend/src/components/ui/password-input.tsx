'use client';

import { ComponentProps, FC, useState } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = Omit<ComponentProps<'input'>, 'type'>;

const PasswordInput: FC<Props> = ({ ...props }) => {
	const [passwordVisible, setPasswordVisible] = useState(false);
	return (
		<Input
			type={passwordVisible ? 'text' : 'password'}
			endContent={
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
			}
			{...props}
		/>
	);
};

export default PasswordInput;
