import { FC, PropsWithChildren } from 'react';
import Link from 'next/link';

const AuthLayout: FC<PropsWithChildren> = ({ children }) => {
	return (
		<div className="flex flex-col h-screen px-8 py-16">
			<nav>
				<Link href="/">
					<h1 className="font-cursive text-2xl tablet:text-4xl">Lumi</h1>
				</Link>
			</nav>
			<main className="flex-grow flex flex-col justify-center items-center gap-y-4">{children}</main>
		</div>
	);
};

export default AuthLayout;
