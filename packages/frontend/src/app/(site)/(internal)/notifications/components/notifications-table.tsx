'use client';

import { FC } from 'react';
import { StoredNotification } from '@lumi/core/types/notification.types';

import { Badge } from '@/components/ui/badge';
import InfiniteLoader from '@/components/ui/infinite-loader';
import Spinner from '@/components/ui/spinner';
import ManagedTable from '@/components/ui/table/managed-table';
import ManagedTableHeader from '@/components/ui/table/managed-table-header';
import NotificationReadToggle from './notification-read-toggle';
import NotificationVisitButton from './notification-visit-button';
import { useNotificationsView } from './notifications-view-provider';
import SelectedNotificationsFloater from './selected-notifications-floater';

const NotificationsTable: FC = () => {
	const {
		data: { notifications, isLoading, isRefetching, isLoadingMore, hasMore, loadMore },
	} = useNotificationsView();

	return (
		<ManagedTable
			loading={isLoading}
			items={notifications ?? []}
			allowRowSelection
			className="tablet:max-w-[45rem] border border-border rounded-lg"
			rowClassName={row => {
				const data = row.original;
				if (data.read) return undefined;
				return 'bg-primary/20';
			}}
			header={
				<>
					<SelectedNotificationsFloater />
					{isRefetching && (
						<Badge variant="outline">
							<Spinner className="size-[12px]" /> Syncing...
						</Badge>
					)}
				</>
			}
			columns={[
				{
					id: 'Description',
					accessorFn: row => ({ title: row.title, content: row.content }),
					header: ({ column }) => <ManagedTableHeader column={column} title="Notification" />,
					cell: ({ row, column }) => {
						const notificationContent = row.getValue<{ title?: string; content: string }>(column.id);
						return (
							<div className="space-y-1">
								{notificationContent.title && (
									<p className="text-primary font-semibold text-xs">{notificationContent.title}</p>
								)}
								<p>{notificationContent.content}</p>
							</div>
						);
					},
					enableHiding: false,
					enableSorting: false,
				},
				{
					id: 'actions',
					accessorFn: row => row,
					header: ({ column }) => <ManagedTableHeader column={column} title="Actions" />,
					cell: ({ row, column }) => {
						const notification = row.getValue<StoredNotification>(column.id);
						return (
							<div className="flex gap-2">
								<NotificationReadToggle notification={notification} />
								<NotificationVisitButton notification={notification} variant="default:flat" iconOnly />
							</div>
						);
					},
					enableHiding: false,
					enableSorting: false,
				},
			]}
			footer={<InfiniteLoader hasMore={hasMore} fetchMore={loadMore} loading={isLoadingMore} />}
		/>
	);
};

export default NotificationsTable;
