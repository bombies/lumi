'use client';

import type { FC } from 'react';
import { TRPCClientError } from '@trpc/client';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { FetchUsersByUsername } from '@/hooks/trpc/user-hooks';
import { trpc } from '@/lib/trpc/trpc-react';

const SendUserRelationshipRequest = () => trpc.relationships.sendRelationshipRequest.useMutation();

const SendRelationshipRequestContent: FC = () => {
	const [searchQuery, setSearchQuery] = useState('');
	const { data: users, isLoading: usersFetching } = FetchUsersByUsername({ searchQuery });
	const router = useRouter();
	const { mutateAsync: sendRelationshipRequest, isPending: isSending } = SendUserRelationshipRequest();

	const flatUsers = useMemo(() => users?.pages.flatMap(page => page.data), [users?.pages]);

	const sendRequest = useCallback(
		async (userId: string) => {
			toast.promise(sendRelationshipRequest(userId), {
				loading: 'Sending request...',
				success: (data) => {
					if ('partner1' in data) {
						router.push('/home');
						return 'Relationship request already exists! You have now created a new space.';
					} else {
						return 'Request sent.';
					}
				},
				error: e => (e instanceof TRPCClientError ? e.message : 'Failed to send request.'),
			});
		},
		[router, sendRelationshipRequest],
	);

	return (
		<Card>
			<CardHeader>
				<CardDescription>
					<p>Type the username of another user you would like to create a new space with.</p>
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="relative">
					<AnimatePresence>
						<Input
							className="z-[21]"
							disabled={isSending}
							onTypingEnd={value => setSearchQuery(value as string)}
							startContent={<p className="ml-2 text-primary/30 pointer-events-none">@</p>}
						/>
						{searchQuery.length > 0 && (
							<motion.div
								transition={{
									ease: 'easeInOut',
								}}
								initial={{
									opacity: 0,
								}}
								animate={{
									opacity: 1,
								}}
								exit={{
									opacity: 0,
								}}
								className="absolute w-full top-[110%] shadow-md rounded-lg bg-background border border-border z-20 p-2 space-y-2"
							>
								{usersFetching
									? (
											<>
												<Skeleton className="h-8 w-full rounded-md" />
												<Skeleton className="h-8 w-full rounded-md" />
												<Skeleton className="h-8 w-full rounded-md" />
												<Skeleton className="h-8 w-full rounded-md" />
											</>
										)
									: flatUsers?.length
										? (
												flatUsers?.map(user => (
													<button
														key={user.id}
														disabled={isSending}
														onClick={() => sendRequest(user.id)}
														className="cursor-pointer w-full hover:bg-primary/10 p-2 rounded-md"
													>
														<p className="text-start">
															<span className="text-xs">@</span>
															<span className="text-primary">{user.username}</span>
														</p>
													</button>
												))
											)
										: (
												<p className="p-2 text-sm text-foreground-secondary/70">No results.</p>
											)}
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</CardContent>
		</Card>
	);
};

export default SendRelationshipRequestContent;
