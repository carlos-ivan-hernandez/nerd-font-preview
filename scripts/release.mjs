// Downloads and unpacks Nerd Fonts release archives. Shared by scripts/fonts.mjs and the dev server plugin
// in scripts/downloads.ts.
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, renameSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

export const TAG = 'v3.5.1';
export const REPO = 'ryanoasis/nerd-fonts';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const fontsDir = join(root, 'public/fonts');
const cacheDir = join(root, 'node_modules/.cache/nerd-fonts', TAG);

// Returns the path of the cached archive, downloading it first if needed.
export async function downloadArchive(name) {
  const archive = join(cacheDir, name);
  if (existsSync(archive)) return archive;
  const response = await fetch(`https://github.com/${REPO}/releases/download/${TAG}/${name}`);
  if (!response.ok) throw new Error(`${name}: ${response.status}`);
  mkdirSync(cacheDir, {recursive: true});
  // Written under a temporary name so an interrupted download isn't mistaken for a finished one.
  writeFileSync(`${archive}.part`, Buffer.from(await response.arrayBuffer()));
  renameSync(`${archive}.part`, archive);
  return archive;
}

export function listArchive(archive) {
  return execFileSync('tar', ['-tJf', archive], {encoding: 'utf8'}).split('\n').filter(Boolean);
}

// Copies the named files out of an archive into public/fonts, dropping any directories in their paths.
export function extract(archive, files) {
  const entries = listArchive(archive).filter(entry => files.includes(basename(entry)));
  mkdirSync(fontsDir, {recursive: true});
  execFileSync('tar', ['-xJf', archive, '-C', fontsDir, ...entries]);
  for (const entry of entries.filter(entry => entry.includes('/'))) {
    renameSync(join(fontsDir, entry), join(fontsDir, basename(entry)));
  }
}

export function basename(path) {
  return path.slice(path.lastIndexOf('/') + 1);
}
