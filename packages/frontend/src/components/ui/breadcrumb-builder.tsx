'use client';

import type { FC } from 'react';
import { Fragment, useMemo } from 'react';

import {
	Breadcrumb,
	BreadcrumbEllipsis,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from './breadcrumb';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';

type BreadcrumbData = { href: string; label: string };

type Props = {
	breadcrumbs: BreadcrumbData[];
	maxVisibleCrumbs?: number;
};

const BreadcrumbBuilder: FC<Props> = ({ breadcrumbs, maxVisibleCrumbs = 3 }) => {
	const { visibleCrumbs, hiddenCrumbs } = useMemo(() => {
		if (breadcrumbs.length <= maxVisibleCrumbs) return { visibleCrumbs: breadcrumbs, hiddenCrumbs: [] };

		const visibleCrumbs: BreadcrumbData[] = [breadcrumbs[0]];

		// Get the last maxVisibleCrumbs - 1 crumbs
		for (let i = breadcrumbs.length - maxVisibleCrumbs + 1; i < breadcrumbs.length; i++)
			visibleCrumbs.push(breadcrumbs[i]);

		const hiddenCrumbs: BreadcrumbData[] = breadcrumbs.filter(crumb => !visibleCrumbs.includes(crumb));

		return { visibleCrumbs, hiddenCrumbs };
	}, [breadcrumbs, maxVisibleCrumbs]);

	// Breadcrumbs but the first and last one
	const visibleCrumbsButFirstandLast = useMemo(
		() =>
			visibleCrumbs.slice(1, visibleCrumbs.length - 1).map((crumb, idx) => (
				<Fragment key={`breadcrumb#${crumb.href}#${idx}`}>
					<BreadcrumbItem>
						<BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
				</Fragment>
			)),
		[visibleCrumbs],
	);

	return (
		breadcrumbs.length && (
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink href={visibleCrumbs[0].href}>{visibleCrumbs[0].label}</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					{/* Hidden crumbs */}
					{hiddenCrumbs.length
						? (
								<BreadcrumbItem>
									<DropdownMenu>
										<DropdownMenuTrigger className="flex items-center gap-1">
											<BreadcrumbEllipsis className="h-4 w-4" />
											<span className="sr-only">Toggle menu</span>
										</DropdownMenuTrigger>
										<DropdownMenuContent>
											{hiddenCrumbs.map((crumb, idx) => (
												<DropdownMenuItem key={`breadcrumb#${crumb.href}#${idx}`} asChild>
													<BreadcrumbItem>
														<BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
													</BreadcrumbItem>
												</DropdownMenuItem>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
								</BreadcrumbItem>
							)
						: undefined}

					{/* Last 2 crumbs */}
					{visibleCrumbsButFirstandLast}
					<BreadcrumbItem>
						<BreadcrumbPage>{visibleCrumbs[visibleCrumbs.length - 1].label}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
		)
	);
};

export default BreadcrumbBuilder;
