'use client';

import { FC, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { RelationshipRequest } from '@lumi/core/types/relationship.types';
import { User } from '@lumi/core/types/user.types';
import { CheckIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouteInvalidation } from '@/lib/hooks/useRouteInvalidation';
import { trpc } from '@/lib/trpc/client';
import { getErrorMessage } from '@/lib/trpc/utils';

const FetchReceivedRequests = () =>
	trpc.relationships.getReceivedRelationshipRequests.useInfiniteQuery(
		{},
		{
			getNextPageParam: lastPage => lastPage.cursor,
		},
	);

const AcceptRelationshipRequest = () => {
	const invalidateRoute = useRouteInvalidation([trpc.relationships.getReceivedRelationshipRequests]);
	const { update: updateSession } = useSession();
	const router = useRouter();
	return trpc.relationships.acceptRelationshipRequest.useMutation({
		async onSuccess(relationship) {
			await updateSession({
				relationshipId: relationship.id,
			});

			invalidateRoute();
			router.push('/home');
		},
	});
};

const RejectRelationshipRequest = () => {
	const invalidateRoute = useRouteInvalidation([trpc.relationships.getReceivedRelationshipRequests]);
	return trpc.relationships.removeRelationshipRequest.useMutation({
		onSuccess() {
			invalidateRoute();
		},
	});
};

type RelationshipRequestProps = {
	request: RelationshipRequest;
	sender: Partial<User>;
	disabled?: boolean;
	onAccept: (req: RelationshipRequest) => void;
	onReject: (req: RelationshipRequest) => void;
};

const RelationshipRequestElement: FC<RelationshipRequestProps> = ({
	request,
	sender,
	disabled,
	onAccept,
	onReject,
}) => {
	return (
		<div className="bg-card border border-border p-4 rounded-md flex w-full h-fit justify-between items-center">
			<div className="space-y-2">
				<p className="text-primary">
					<span className="text-xs text-foreground">@</span>
					{sender.username ?? 'Unknown'}
				</p>
				<p className="text-xs text-foreground-secondary/50">
					{new Date(request.createdAt).toLocaleDateString()}
				</p>
			</div>
			<div className="flex gap-2">
				<Button size="icon" tooltip="Accept request" disabled={disabled} onClick={() => onAccept(request)}>
					<CheckIcon className="size-[18px]" />
				</Button>
				<Button
					size="icon"
					tooltip="Reject request"
					variant="destructive"
					disabled={disabled}
					onClick={() => onReject(request)}
				>
					<XIcon className="size-[18px]" />
				</Button>
			</div>
		</div>
	);
};

const ReceivedRelationshipRequestsContent: FC = () => {
	const { data: receivedRequests, isLoading: isFetchingRequests } = FetchReceivedRequests();
	const { mutateAsync: acceptRequest, isPending: isAccepting } = AcceptRelationshipRequest();
	const { mutateAsync: rejectRequest, isPending: isRejecting } = RejectRelationshipRequest();

	const flatRequests = useMemo(() => receivedRequests?.pages.flatMap(page => page.data), [receivedRequests?.pages]);

	const requestElements = useMemo(
		() =>
			flatRequests?.map(({ otherUser, ...req }) => (
				<RelationshipRequestElement
					key={req.id}
					request={req}
					sender={otherUser}
					disabled={isAccepting || isRejecting}
					onAccept={elReq => {
						toast.promise(acceptRequest(elReq.id), {
							loading: 'Accepting request...',
							success() {
								return `You have accepted the relationship request from ${otherUser.username}.`;
							},
							error(e) {
								return getErrorMessage(e);
							},
						});
					}}
					onReject={async elReq => {
						toast.promise(rejectRequest(elReq.id), {
							loading: 'Rejecting request...',
							success() {
								return `You have rejected the relationship request from ${otherUser.username}.`;
							},
							error(e) {
								return getErrorMessage(e);
							},
						});
					}}
				/>
			)),
		[acceptRequest, flatRequests, isAccepting, isRejecting, rejectRequest],
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
					<>{requestElements?.length ? requestElements : <p>You have no requests.</p>}</>
				)}
			</CardContent>
		</Card>
	);
};

export default ReceivedRelationshipRequestsContent;
