'use client';

import type { FC, PropsWithChildren, RefObject } from 'react';
import { createContext, use, useCallback, useMemo } from 'react';

type MomentMessageGroupData = {
	scrollAreaRef: RefObject<HTMLDivElement | null>;
	getScrollViewport: () => Element | null | undefined;
};

const MomentMessageGroupContext = createContext<MomentMessageGroupData | undefined>(undefined);

export const useMomentMessageGroupData = () => {
	const context = use(MomentMessageGroupContext);
	if (!context) {
		throw new Error('useMomentMessageGroupData must be used within a MomentMessageGroup');
	}
	return context;
};

type MomentMessageGroupProviderProps = PropsWithChildren<{
	scrollAreaRef: RefObject<HTMLDivElement | null>;
}>;

const MomentMessageGroupProvider: FC<MomentMessageGroupProviderProps> = ({ scrollAreaRef, children }) => {
	const getScrollViewport = useCallback(
		() => scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]'),
		[scrollAreaRef],
	);

	const values = useMemo<MomentMessageGroupData>(() => ({
		getScrollViewport,
		scrollAreaRef,
	}), [getScrollViewport, scrollAreaRef]);

	return (
		<MomentMessageGroupContext value={values}>
			{children}
		</MomentMessageGroupContext>
	);
};

export default MomentMessageGroupProvider;
