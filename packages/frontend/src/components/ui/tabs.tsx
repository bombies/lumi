'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

type TabsContext = {
	value: string;
	setValue: (value: string) => void;
};

const TabsContext = React.createContext<TabsContext>({
	value: '',
	setValue: () => {},
});

const useTabsContext = () => {
	const context = React.useContext(TabsContext);
	if (!context) {
		throw new Error('Tabs compound components cannot be rendered outside the Tabs component');
	}
	return context;
};

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
	const [selectedItem = '', setSelectedItem] = useControllableState<string>({
		prop: props.value,
		defaultProp: props.defaultValue,
		onChange: props.onValueChange,
	});
	return (
		<TabsContext.Provider
			value={React.useMemo(
				() => ({
					value: selectedItem,
					setValue: setSelectedItem,
				}),
				[selectedItem, setSelectedItem],
			)}
		>
			<TabsPrimitive.Root
				data-slot="tabs"
				className={cn('flex flex-col gap-2', className)}
				{...props}
				value={selectedItem}
				onValueChange={setSelectedItem}
			/>
		</TabsContext.Provider>
	);
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
	return (
		<TabsPrimitive.List
			data-slot="tabs-list"
			className={cn(
				'bg-muted text-muted-foreground inline-flex h-fit w-fit items-center justify-center rounded-lg p-1',
				className,
			)}
			{...props}
		/>
	);
}

function TabsTrigger({ className, children, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
	const { value } = useTabsContext();
	const isActive = React.useMemo(() => value === props.value, [props.value, value]);
	return (
		<TabsPrimitive.Trigger
			data-slot="tabs-trigger"
			className={cn(
				"data-[state=active]:text-foreground focus-visible:border-ring cursor-pointer focus-visible:ring-ring/50 focus-visible:outline-ring inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-3 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 relative",
				className,
			)}
			{...props}
		>
			{isActive && (
				<motion.div
					layoutId="tabs-active-pill"
					className="absolute inset-0 bg-background shadow-sm"
					style={{
						borderRadius: 'calc(.85rem - 2px)',
					}}
				></motion.div>
			)}
			<span className="relative z-10 inline-flex gap-2 items-center">{children}</span>
		</TabsPrimitive.Trigger>
	);
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
	return (
		<TabsPrimitive.Content data-slot="tabs-content" className={cn('flex-1 outline-none', className)} {...props} />
	);
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
