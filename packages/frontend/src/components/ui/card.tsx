import * as React from 'react';

import { cn } from '@/lib/utils';

function Card({ className, glass, ...props }: React.ComponentProps<'div'> & { glass?: boolean }) {
	return (
		<div
			data-slot="card"
			className={cn(
				'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-border py-6',
				glass && 'backdrop-blur-lg bg-background/50',
				className,
			)}
			{...props}
		/>
	);
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
	return <div data-slot="card-header" className={cn('flex flex-col gap-1.5 px-6', className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
	return <div data-slot="card-title" className={cn('leading-none font-semibold', className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="card-description"
			className={cn('text-foreground-secondary/70 text-sm', className)}
			{...props}
		/>
	);
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
	return <div data-slot="card-content" className={cn('px-6', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
	return <div data-slot="card-footer" className={cn('flex items-center px-6', className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
