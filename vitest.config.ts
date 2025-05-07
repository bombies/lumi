import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		globals: true,
		environment: 'node',
		setupFiles: ['./packages/core/__tests__/utils/setup.ts'],
		include: ['./packages/core/__tests__/**/*.test.ts', './packages/functions/__tests__/**/*.test.ts'],
		coverage: {
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'packages/core/__tests__/',
				'packages/functions/__tests__/',
			],
		},
		testTimeout: 30000,
		printConsoleTrace: true,
		silent: false,
	},
});
