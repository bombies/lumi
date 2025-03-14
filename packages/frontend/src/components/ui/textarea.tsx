import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				'h-10 w-full bg-input text-foreground rounded-lg border border-primary/10 self-center p-3 text-sm !ring-0 !outline-hidden placeholder:text-foreground/20  disabled:cursor-not-allowed disabled:opacity-50',
				className,
			)}
			{...props}
		/>
	);
}

export { Textarea };
