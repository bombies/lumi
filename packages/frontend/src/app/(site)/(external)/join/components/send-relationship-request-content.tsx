'use client';

import { FC, useMemo, useState } from 'react';
import { skipToken } from '@tanstack/react-query';
import { UserPlus2Icon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc/client';

const FetchUsersByUsername = ({ searchQuery }: { searchQuery: string }) =>
	trpc.users.getUsersByUsername.useInfiniteQuery(searchQuery.length > 0 ? { username: searchQuery } : skipToken, {
		getNextPageParam: lastPage => lastPage.cursor,
	});

const SendRelationshipRequestContent: FC = () => {
	const [searchQuery, setSearchQuery] = useState('');
	const { data: users, isLoading: usersFetching } = FetchUsersByUsername({ searchQuery });

	const flatUsers = useMemo(() => users?.pages.flatMap(page => page.data), [users?.pages]);

	console.log(usersFetching);

	return (
		<Card>
			<CardHeader>
				<CardDescription>
					<p>Type the username of another use you would like to create a new space with.</p>
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="relative">
					<AnimatePresence>
						<Input
							className="z-[21]"
							onTypingEnd={value => setSearchQuery(value as string)}
							startContent={<p className="ml-2 text-primary/30 pointer-events-none">@</p>}
							endContent={
								<Button size="icon">
									<UserPlus2Icon size={18} />
								</Button>
							}
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
								{usersFetching ? (
									<>
										<Skeleton className="h-8 w-full rounded-md" />
										<Skeleton className="h-8 w-full rounded-md" />
										<Skeleton className="h-8 w-full rounded-md" />
										<Skeleton className="h-8 w-full rounded-md" />
									</>
								) : flatUsers?.length ? (
									flatUsers?.map(user => (
										<button
											key={user.id}
											className="cursor-pointer w-full hover:bg-primary/10 p-2 rounded-md"
										>
											<p className="text-start">
												<span className="text-xs">@</span>
												<span className="text-primary">{user.username}</span>
											</p>
										</button>
									))
								) : (
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
