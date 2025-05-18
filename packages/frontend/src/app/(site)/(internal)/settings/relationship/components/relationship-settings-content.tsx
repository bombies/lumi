'use client';

import type { FC } from 'react';

import { useRelationship } from '@/components/providers/relationships/relationship-provder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UserAvatar from '@/components/ui/user-avatar';
import { HeartIcon } from '@heroicons/react/24/solid';
import { convertDate, formatDuration } from '@lumi/core/utils/global-utils';
import { CalendarHeartIcon } from 'lucide-react';
import { useMemo } from 'react';
import ChangeAnniversaryDateButton from './change-anniversary-date-button';

const RelationshipSettingsContent: FC = () => {
	const { partner, self, relationship } = useRelationship();

	const anniversaryDate = useMemo(() => {
		if (!partner || !self) return null;

		return new Date(relationship.anniversary ?? relationship.createdAt);
	}, [partner, relationship.anniversary, relationship.createdAt, self]);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-2xl">Your Relationship</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col tablet:flex-row gap-4 items-center">
				<div className="flex gap-2 items-center justify-center">
					<UserAvatar user={self} hideStatus />
					<HeartIcon className="w-6 h-6 text-red-500" />
					<UserAvatar user={partner} />
				</div>

				<div className="space-y-2 flex flex-col">
					<h3 className="text-2xl font-bold text-center tablet:text-left">
						{partner.firstName}
						{' & '}
						{self.firstName}
					</h3>
					<div className="text-center tablet:text-left items-center flex gap-2">
						<p>
							<CalendarHeartIcon className="size-[16px] inline-block text-primary shrink-0" />
							{' '}
							Together since
							{' '}
							<span className="text-primary font-semibold">
								{anniversaryDate?.toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'long',
									day: '2-digit',
								})}
							</span>

							<span className="text-muted">
								<span className="mx-2">|</span>
								{formatDuration(anniversaryDate ?? new Date(), {
									seconds: false,
									minutes: false,
								})}
							</span>

						</p>
					</div>
					<ChangeAnniversaryDateButton />
					<div className="p-4 rounded-sm border border-dashed border-primary bg-primary/10 flex flex-col items-center gap-1">
						<h3 className="text-primary">Today&apos;s Milestone</h3>
						<p className="font-bold text-3xl">
							Day
							{' '}
							{convertDate(anniversaryDate ?? new Date(), 'days')}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default RelationshipSettingsContent;
