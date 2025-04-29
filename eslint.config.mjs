import antfu from '@antfu/eslint-config';
import nextPlugin from '@next/eslint-plugin-next';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default antfu(
	{
		react: true,
		typescript: true,

		// Configuration preferences
		lessOpinionated: true,
		isInEditor: false,

		// Code style
		stylistic: {
			semi: true,
			indent: 'tab',
		},

		// Format settings
		formatters: true,
	},
	// --- Next.js Specific Rules ---
	{
		plugins: {
			'@next/next': nextPlugin,
		},
		rules: {
			...nextPlugin.configs.recommended.rules,
			...nextPlugin.configs['core-web-vitals'].rules,
		},
	},
	// --- Accessibility Rules ---
	jsxA11y.flatConfigs.recommended,
	// --- Custom Rule Overrides ---
	{
		rules: {
			'antfu/no-top-level-await': 'off', // Allow top-level await
			'style/brace-style': ['error', '1tbs'], // Use the default brace style
			'ts/consistent-type-definitions': 'off', // Use `type` instead of `interface`
			'react/prefer-destructuring-assignment': 'off', // Vscode doesn't support automatically destructuring, it's a pain to add a new variable
			'node/prefer-global/process': 'off', // Allow using `process.env`
			'react-hooks/react-compiler': 'error',
			'antfu/curly': 'off',
			'curly': 'off',
			'no-console': 'off',
			'no-case-declarations': 'off',
			'no-use-before-define': 'warn',
			'ts/no-use-before-define': 'warn',
			'react/no-nested-component-definitions': 'off',
			'react/no-context-provider': 'off',
		},
	},
);
