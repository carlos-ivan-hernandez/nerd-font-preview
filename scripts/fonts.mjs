// Builds src/fonts.json, the list of Nerd Fonts the app can preview, from the release in TAG. Run it with
// `pnpm fonts` after changing TAG.
//
// Most fonts are checked into the nerd-fonts repo, so the browser loads them from jsDelivr. Some are only
// published as release archives (GitHub release downloads don't allow cross-origin requests). Listing what's
// inside those means downloading them, so this caches every archive once. The app's dev server copies their
// fonts into public/fonts when someone downloads them from the app.
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {basename, downloadArchive, listArchive, REPO, root, TAG} from './release.mjs';

// Proportional (non-monospace) fonts and the symbols-only font, which don't make sense as a terminal font.
const SKIP = new Set([
  'Arimo',
  'Tinos',
  'Ubuntu',
  'UbuntuSans',
  'LiterationSans',
  'LiterationSerif',
  'NotoSans',
  'NotoSerif',
  'Overpass',
  'M+1',
  'M+2',
  'iMWritingDuo',
  'iMWritingQuat',
  'OpenDyslexic',
  'OpenDyslexicAlt',
  'Symbols',
]);

const REGULAR = /^(.+)NerdFont-Regular\.(ttf|otf)$/;

const headers = {Accept: 'application/vnd.github+json'};
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const release = await getJson(`https://api.github.com/repos/${REPO}/releases/tags/${TAG}`);
const tree = await getJson(`https://api.github.com/repos/${REPO}/git/trees/${TAG}?recursive=1`);
const repoSizes = new Map(tree.tree.map(entry => [entry.path, entry.size]));
const repoPaths = new Set(repoSizes.keys());

const fonts = [];

for (const asset of release.assets) {
  if (!asset.name.endsWith('.tar.xz')) continue;
  const group = asset.name.slice(0, -'.tar.xz'.length);
  if (group === 'FontPatcher') continue;
  const download = `https://github.com/${REPO}/releases/download/${TAG}/${group}.zip`;

  const inRepo = [...repoPaths].filter(path => path.startsWith(`patched-fonts/${group}/`));
  if (inRepo.some(path => REGULAR.test(basename(path)))) {
    for (const path of inRepo) {
      const match = REGULAR.exec(basename(path));
      if (!match || SKIP.has(match[1])) continue;
      const monoPath = path.replace('NerdFont-', 'NerdFontMono-');
      fonts.push({
        id: match[1],
        group,
        url: cdn(path),
        monoUrl: repoPaths.has(monoPath) ? cdn(monoPath) : null,
        download,
        size: repoSizes.get(path),
        monoSize: repoSizes.get(monoPath) ?? null,
      });
    }
    continue;
  }

  console.log(`reading ${asset.name} (${Math.round(asset.size / 1024 / 1024)} MB)`);
  // Archives are downloaded one at a time to keep the load on GitHub reasonable.
  // oxlint-disable-next-line no-await-in-loop
  const files = listArchive(await downloadArchive(asset.name)).map(basename);
  const before = fonts.length;
  for (const file of files) {
    const match = REGULAR.exec(file);
    if (!match || SKIP.has(match[1])) continue;
    const mono = file.replace('NerdFont-', 'NerdFontMono-');
    fonts.push({
      id: match[1],
      group,
      url: `fonts/${file}`,
      monoUrl: files.includes(mono) ? `fonts/${mono}` : null,
      download,
      archive: {name: asset.name, size: asset.size},
    });
  }
  if (fonts.length === before) console.warn(`${group}: no Regular font found, skipping`);
}

fonts.sort((a, b) => a.id.localeCompare(b.id, 'en', {sensitivity: 'base'}));
writeFileSync(join(root, 'src/fonts.json'), `${JSON.stringify({tag: TAG, fonts}, null, 2)}\n`);
console.log(`wrote ${fonts.length} fonts to src/fonts.json`);

async function getJson(url) {
  const response = await fetch(url, {headers});
  if (!response.ok) throw new Error(`${url}: ${response.status} ${await response.text()}`);
  return response.json();
}

function cdn(path) {
  return `https://cdn.jsdelivr.net/gh/${REPO}@${TAG}/${path}`;
}
