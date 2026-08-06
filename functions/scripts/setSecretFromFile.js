'use strict';

/**
 * Upload a Firebase/Google Secret Manager secret from a local one-line file.
 *
 * Usage (from repo root or functions/):
 *   1. Put ONLY the secret value in a temp file, e.g. secrets-tmp.txt
 *   2. node functions/scripts/setSecretFromFile.js STRIPE_SECRET_KEY secrets-tmp.txt
 *   3. Delete the temp file
 *
 * Never commit the temp file.
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const secretName = process.argv[2];
const filePath = process.argv[3];

if (!secretName || !filePath) {
  console.error(
    'Usage: node functions/scripts/setSecretFromFile.js SECRET_NAME path/to/file.txt'
  );
  process.exit(1);
}

if (!/^[A-Z][A-Z0-9_]*$/.test(secretName)) {
  console.error('Secret name must be UPPER_SNAKE_CASE, e.g. STRIPE_SECRET_KEY');
  process.exit(1);
}

const abs = path.resolve(filePath);
if (!fs.existsSync(abs)) {
  console.error(`File not found: ${abs}`);
  process.exit(1);
}

const value = fs.readFileSync(abs, 'utf8').trim();
if (!value) {
  console.error('File is empty.');
  process.exit(1);
}

const repoRoot = path.resolve(__dirname, '..', '..');
const result = spawnSync(
  'npx',
  ['--yes', 'firebase-tools', 'functions:secrets:set', secretName],
  {
    cwd: repoRoot,
    input: `${value}\n`,
    encoding: 'utf8',
    shell: true,
    stdio: ['pipe', 'inherit', 'inherit'],
  }
);

if (result.status !== 0) {
  console.error('Failed to set secret. Exit code:', result.status);
  process.exit(result.status || 1);
}

console.log(`\nOK: ${secretName} updated.`);
console.log(`Delete the temp file now: ${abs}`);
