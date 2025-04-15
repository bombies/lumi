'use client';

import { FC } from 'react';

import { useRelationship } from '@/components/providers/relationships/relationship-provder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UserAvatar from '@/components/ui/user-avatar';

const RelationshipSettingsContent: FC = () => {
	const { partner } = useRelationship();
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-2xl">Your Partner</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col tablet:flex-row gap-4 items-center">
				<UserAvatar user={partner} />
				<div className="space-y-1">
					<h3 className="text-xl font-medium text-center tablet:text-left">
						{partner.firstName} {partner.lastName}
					</h3>
					<p className="text-center tablet:text-left">{partner.email}</p>
				</div>
			</CardContent>
		</Card>
	);
};

export default RelationshipSettingsContent;
