import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import Spinner from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
	"cursor-pointer inline-flex items-center transition-colors justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
	{
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
				accent: 'bg-accent text-accent-foreground shadow-xs hover:bg-accent/90',
				'default:flat': 'bg-primary/10 text-primary shadow-xs hover:bg-primary/50',
				destructive:
					'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
				'destructive:flat':
					'bg-destructive/10 text-destructive shadow-xs hover:bg-destructive/30 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
				outline: 'border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
				secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
				ghost: 'hover:bg-accent hover:text-accent-foreground',
				'ghost:secondary': 'hover:bg-secondary hover:text-secondary-foreground',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-9 px-4 py-2 has-[>svg]:px-3',
				sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
				lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
				icon: 'size-9',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

type Props = React.ComponentProps<'button'> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
		loading?: boolean;
		tooltip?: React.ReactElement<any> | string;
	};

function Button({
	type = 'button',
	className,
	variant,
	size,
	asChild = false,
	loading,
	children,
	tooltip,
	...props
}: Props) {
	const Comp = asChild ? Slot : 'button';
	const currentChildren = React.useMemo(
		() => (loading ? <Spinner size={12} light={!variant || variant !== 'outline'} /> : children),
		[children, loading, variant],
	);

	const elem = React.useMemo(
		() => (
			<Comp
				{...props}
				data-slot="button"
				type={type}
				disabled={props.disabled || loading}
				className={cn(buttonVariants({ variant, size, className }), props.disabled && 'opacity-50')}
			>
				{currentChildren}
			</Comp>
		),
		[Comp, className, currentChildren, loading, props, size, type, variant],
	);

	return tooltip ? (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>{elem}</TooltipTrigger>
				<TooltipContent>{tooltip}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	) : (
		elem
	);
}

export { Button, buttonVariants };
