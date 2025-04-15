'use client';

import { FC, useMemo } from 'react';
import { TrashIcon } from '@heroicons/react/24/solid';
import { RelationshipRequest } from '@lumi/core/relationships/relationship.types';
import { User } from '@lumi/core/users/user.types';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouteInvalidation } from '@/lib/hooks/useRouteInvalidation';
import { trpc } from '@/lib/trpc/client';
import { getErrorMessage } from '@/lib/trpc/utils';

const FetchSentRequests = () =>
	trpc.relationships.getSentRelationshipRequests.useInfiniteQuery(
		{},
		{
			getNextPageParam: lastPage => lastPage.cursor,
		},
	);

const DeleteRelationshipRequest = () => {
	const invalidateRoute = useRouteInvalidation([trpc.relationships.getSentRelationshipRequests]);
	return trpc.relationships.removeRelationshipRequest.useMutation({
		onSuccess() {
			invalidateRoute();
		},
	});
};

type RelationshipRequestProps = {
	request: RelationshipRequest;
	sender?: Partial<User>;
	disabled?: boolean;
	onDelete: (req: RelationshipRequest) => void;
};

const RelationshipRequestElement: FC<RelationshipRequestProps> = ({
	request,
	sender,
	disabled,
	onDelete: onReject,
}) => {
	return (
		<div className="bg-card border border-border p-4 rounded-md flex w-full h-fit justify-between items-center">
			<div className="space-y-2">
				<p className="text-primary">
					<span className="text-xs text-foreground">@</span>
					{sender?.username ?? 'Unknown'}
				</p>
				<p className="text-xs text-foreground-secondary/50">
					{new Date(request.createdAt).toLocaleDateString()}
				</p>
			</div>
			<div className="flex gap-2">
				<Button
					size="icon"
					tooltip="Delete Request"
					variant="destructive"
					disabled={disabled}
					onClick={() => onReject(request)}
				>
					<TrashIcon className="size-[18px]" />
				</Button>
			</div>
		</div>
	);
};

const SentRelationshipRequestsContainer: FC = () => {
	const { data: sentRequests, isLoading: isFetchingRequests } = FetchSentRequests();
	const { mutateAsync: deleteRequest, isPending: isDeleting } = DeleteRelationshipRequest();

	const flatRequests = useMemo(() => sentRequests?.pages.flatMap(page => page.data), [sentRequests?.pages]);

	const requestElements = useMemo(
		() =>
			flatRequests?.map(({ otherUser, ...req }) => (
				<RelationshipRequestElement
					key={req.id}
					request={req}
					sender={otherUser}
					disabled={isDeleting}
					onDelete={async elReq => {
						toast.promise(deleteRequest(elReq.id), {
							loading: 'Deleting request...',
							success() {
								return `You have delete the relationship request to ${otherUser?.username ?? 'Unknown user'}.`;
							},
							error(e) {
								return getErrorMessage(e);
							},
						});
					}}
				/>
			)),
		[deleteRequest, flatRequests, isDeleting],
	);

	return (
		<Card>
			<CardContent className="space-y-4">
				{isFetchingRequests ? (
					<>
						<Skeleton className="w-full h-12 rounded-md" />
						<Skeleton className="w-full h-12 rounded-md" />
						<Skeleton className="w-full h-12 rounded-md" />
						<Skeleton className="w-full h-12 rounded-md" />
						<Skeleton className="w-full h-12 rounded-md" />
					</>
				) : (
					<>{requestElements?.length ? requestElements : <p>You have sent no requests.</p>}</>
				)}
			</CardContent>
		</Card>
	);
};

export default SentRelationshipRequestsContainer;
