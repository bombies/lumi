import * as React from 'react';
import css from "./ui.css" assert { type: "text" }
import { authTheme } from '.';

const theme = authTheme;

export const AuthLayout: React.FC<React.PropsWithChildren<{
    size?: "small"
  }>> = ({size}) => {
	return (
		<html
        lang='en'
			style={{
				'--color-background-light': theme.background.light,
				'--color-background-dark': theme.background.dark,
				'--color-primary-light': theme.primary,
				'--color-primary-dark': theme.primary,
				//   "--font-family": theme?.font?.family,
				//   "--font-scale": theme?.font?.scale,
				'--border-radius': theme.radius,
			}}
		>
			<head>
				<title>{theme?.title || 'OpenAuthJS'}</title>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<>
					<link
						rel="icon"
						href="https://openauth.js.org/favicon.ico"
						sizes="48x48"
					/>
					<link
						rel="icon"
						href="https://openauth.js.org/favicon.svg"
						media="(prefers-color-scheme: light)"
					/>
					<link
						rel="icon"
						href="https://openauth.js.org/favicon-dark.svg"
						media="(prefers-color-scheme: dark)"
					/>
					<link
						rel="shortcut icon"
						href="https://openauth.js.org/favicon.svg"
						type="image/svg+xml"
					/>
				</>
				<style dangerouslySetInnerHTML={{ __html: css }} />
				{/* {theme?.css && <style dangerouslySetInnerHTML={{ __html: theme.css }} />} */}
			</head>
			<body>
				<div data-component="root">
					<div data-component="center" data-size={props.size}>
						{/* {hasLogo ? (
							<>
								<img
									data-component="logo"
									src={get('logo', 'light')}
									data-mode="light"
								/>
								<img
									data-component="logo"
									src={get('logo', 'dark')}
									data-mode="dark"
								/>
							</>
						) : (
							ICON_OPENAUTH
						)} */}
						{props.children}
					</div>
				</div>
			</body>
		</html>
	);
};
