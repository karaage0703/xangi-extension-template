import { mkdir, writeFile } from 'node:fs/promises';
import { envPrefix, loadConfig, manifestFor, validateConfig } from '../src/config.mjs';
import { skillFor } from './skill.mjs';

const root = new URL('../', import.meta.url);
const config = await loadConfig(root);
const args = process.argv.slice(2),
  options = new Map();
for (let i = 0; i < args.length; i += 2) {
  const key = args[i],
    value = args[i + 1];
  if (!['--id', '--name', '--features'].includes(key) || value === undefined || options.has(key)) {
    throw new Error(
      'Usage: node scripts/configure.mjs [--id ID] [--name NAME] [--features ui,device,ai|none]'
    );
  }
  options.set(key, value);
}
if (options.has('--id')) config.id = options.get('--id');
if (options.has('--name')) config.displayName = options.get('--name');
if (options.has('--features')) {
  const features = options.get('--features') === 'none' ? [] : options.get('--features').split(',');
  if (
    features.some((key) => !['ui', 'device', 'ai'].includes(key)) ||
    new Set(features).size !== features.length
  ) {
    throw new Error('Features must be a comma-separated subset of ui,device,ai, or none.');
  }
  config.features = Object.fromEntries(
    ['ui', 'device', 'ai'].map((key) => [key, features.includes(key)])
  );
}
validateConfig(config);
const manifest = manifestFor(config);
const skill = await skillFor(config);
await mkdir(new URL('skills/extension-operations/', root), { recursive: true });
await writeFile(new URL('extension.config.json', root), JSON.stringify(config, null, 2) + '\n');
await writeFile(new URL('xangi-extension.json', root), JSON.stringify(manifest, null, 2) + '\n');
await writeFile(new URL('skills/extension-operations/SKILL.md', root), skill);
console.log(
  `Configured ${config.id}: ${
    Object.keys(config.features)
      .filter((key) => config.features[key])
      .join(', ') || 'base only'
  }`
);

console.log('Environment prefix: ' + envPrefix(config));
console.log('Generated operation skill: skills/extension-operations/SKILL.md');
