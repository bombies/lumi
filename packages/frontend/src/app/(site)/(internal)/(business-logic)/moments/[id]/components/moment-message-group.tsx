'use client';

import type { MomentMessage } from '@lumi/core/moments/moment.types';
import type { FC } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import MomentMessageContainer from '@/app/(site)/(internal)/(business-logic)/moments/[id]/components/moment-message-container';
import { useMomentMessageGroupData } from '@/app/(site)/(internal)/(business-logic)/moments/[id]/components/moment-message-group-provider';
import { cn } from '@/lib/utils';

type Props = {
	date: string;
	messageContainers: [string, MomentMessage[]][];
};

const MomentMessageGroup: FC<Props> = ({ date, messageContainers }) => {
	const { getScrollViewport } = useMomentMessageGroupData();
	const [dateIsSticky, setDateIsSticky] = useState(false);
	const [dateVisible, setDateVisisble] = useState(true);
	const [dateTimeout, setDateTimeout] = useState<NodeJS.Timeout | undefined>(undefined);
	const dateRef = useRef<HTMLParagraphElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const clearDateTimeout = useCallback(() => {
		if (dateTimeout) {
			clearTimeout(dateTimeout);
			setDateTimeout(undefined);
		}
	}, [dateTimeout]);

	const createDateTimeout = useCallback(() => {
		setDateVisisble(true);
		setDateTimeout((prev) => {
			if (prev) clearTimeout(prev);
			return setTimeout(() => {
				setDateVisisble(false);
			}, 2000);
		});
	}, []);

	useEffect(() => {
		const scrollViewport = getScrollViewport();

		const handleScroll = () => {
			if (containerRef.current && scrollViewport) {
				// Get the date header's position
				const containerRect = containerRef.current.getBoundingClientRect();

				// Get the scrollable area's position
				const scrollAreaRect = scrollViewport.getBoundingClientRect();

				// Calculate the offset from the top of the scrollable area
				const offsetFromScrollAreaTop = containerRect.top - scrollAreaRect.top;

				// Calculate the threshold where the element should be considered sticky
				// This should be the configured top value in your sticky CSS (which is 0 in this case)
				const stickyThreshold = 0;

				const isSticky = offsetFromScrollAreaTop >= stickyThreshold;

				// Check if it's sticky - element has reached the top of its scrollable container
				setDateIsSticky(() => {
					if (isSticky) {
						// If it's sticky, clear any existing timeout and make the date visible
						clearDateTimeout();
						setDateVisisble(true);
					} else {
						// If it's currently floating, reset timeout and keep it visible.
						createDateTimeout();
					}
					return isSticky;
				});

				// logger.debug('scroll!', {
				// 	dateTop: containerRect.top,
				// 	scrollAreaTop: scrollAreaRect.top,
				// 	offset: offsetFromScrollAreaTop,
				// 	isSticky,
				// });
			}
		};

		if (scrollViewport) {
			scrollViewport.addEventListener('scroll', handleScroll);
		}

		// Clean up the event listener
		return () => {
			if (scrollViewport) {
				scrollViewport.removeEventListener('scroll', handleScroll);
			}

			clearDateTimeout();
		};
	}, [clearDateTimeout, createDateTimeout, dateTimeout, getScrollViewport]);

	return (
		<div ref={containerRef} className="space-y-2">
			<p
				ref={dateRef}
				className={cn(
					'text-center text-white/30 text-xs w-fit font-semibold z-20 sticky top-0 mx-auto transition-all duration-200 rounded-sm px-2 py-1',
					!dateIsSticky && 'bg-background border border-border text-foreground',
					!dateIsSticky && !dateVisible && 'opacity-0',
				)}
			>
				{new Date(Number.parseInt(date)).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: '2-digit',
				})}
			</p>
			{messageContainers.map(([senderId, messagesInGroup], groupIndex) => (
				<MomentMessageContainer
					key={`messagecontainer_${senderId}_${messagesInGroup[0]?.id ?? groupIndex}`}
					messages={messagesInGroup}
				/>
			))}
		</div>
	);
};

export default MomentMessageGroup;
