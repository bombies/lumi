#!/usr/bin/env node

// detectShell.js
//
// Usage: npm run sync -- <stage>
//   e.g. npm run sync -- dev

import { spawnSync } from 'child_process';
import { platform } from 'os';

// Get the stage argument (e.g., "dev", "prod") from command line
// If none provided, you can handle defaults or throw an error.
const args = process.argv.slice(2);
if (args.length < 1) {
    console.error('Usage: npm run sync -- <stage>');
    process.exit(1);
}
const stage = args[0];

// Check environment variables commonly used for shells
const shell = process.env.SHELL || process.env.ComSpec || '';
const cwd = process.cwd();

if (!cwd.endsWith("personal-portfolio-3")) {
    console.error('[ERROR] Please run this script from the root of the project with the command: bun run sync-secrets -- <stage>');
    process.exit(1);
}

const baseDir = cwd + '/packages/scripts/src';


console.log(`[INFO] Running in directory: ${baseDir}`);

// Decide which script to run
// 1. If we're clearly in Fish, run the .fish script
// 2. If we're on Windows (win32), run the .bat script
// 3. Otherwise, default to the .sh script
if (shell.includes('fish')) {
    console.log(`[INFO] Detected Fish shell. Running sync_secrets.fish with stage: ${stage}`);
    spawnSync('fish', [`${baseDir}/sync_secrets.fish`, stage], { stdio: 'inherit' });
} else if (platform() === 'win32') {
    console.log(`[INFO] Detected Windows. Running sync_secrets.bat with stage: ${stage}`);
    spawnSync('cmd.exe', ['/c', `${baseDir}/sync_secrets.bat`, stage], { stdio: 'inherit' });
} else {
    console.log(`[INFO] Detected Bash/Unix shell. Running sync_secrets.sh with stage: ${stage}`);
    spawnSync('sh', [`${baseDir}/sync_secrets.sh`, stage], { stdio: 'inherit' });
}