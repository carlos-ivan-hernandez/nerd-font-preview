// Vite plugin that lets the app download the fonts that are only published in release archives. The browser
// can't fetch those itself (GitHub release downloads don't allow cross-origin requests), so the dev and
// preview servers do it and unpack the Regular files into public/fonts.
//
//   GET  /api/downloads         {downloaded: [group, …]}
//   POST /api/downloads/:group  downloads and unpacks one release archive
//   GET  /fonts/:file           serves a downloaded font (also in `vite preview`, where dist/ doesn't have it)
import {createReadStream, existsSync, readFileSync} from 'node:fs';
import {type IncomingMessage, type ServerResponse} from 'node:http';
import {join} from 'node:path';
import {type Connect, type Plugin} from 'vite';
import {basename, downloadArchive, extract, fontsDir, root} from './release.mjs';

type Entry = {group: string; url: string; monoUrl: string | null; archive?: {name: string}};

function groups() {
  const {fonts} = JSON.parse(readFileSync(join(root, 'src/fonts.json'), 'utf8')) as {fonts: Entry[]};
  const byGroup = new Map<string, {archive: string; files: string[]}>();
  for (const font of fonts) {
    if (!font.archive) continue;
    const group = byGroup.get(font.group) ?? {archive: font.archive.name, files: []};
    for (const url of [font.url, font.monoUrl]) if (url) group.files.push(basename(url));
    byGroup.set(font.group, group);
  }
  return byGroup;
}

function isDownloaded(files: string[]) {
  return files.every(file => existsSync(join(fontsDir, file)));
}

// One download per archive at a time, even if the button is clicked twice.
const pending = new Map<string, Promise<void>>();

function download(group: string, archive: string, files: string[]) {
  let job = pending.get(group);
  if (!job) {
    job = downloadArchive(archive)
      .then(path => extract(path, files))
      .finally(() => pending.delete(group));
    pending.set(group, job);
  }
  return job;
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

const middleware: Connect.NextHandleFunction = (req: IncomingMessage, res: ServerResponse, next) => {
  const path = decodeURIComponent((req.url ?? '').split('?')[0]);

  if (path === '/api/downloads' && req.method === 'GET') {
    const downloaded = [...groups()].filter(([, group]) => isDownloaded(group.files)).map(([name]) => name);
    return json(res, 200, {downloaded});
  }

  if (path.startsWith('/api/downloads/') && req.method === 'POST') {
    const name = path.slice('/api/downloads/'.length);
    const group = groups().get(name);
    if (!group) return json(res, 404, {error: `Unknown font family ${name}`});
    download(name, group.archive, group.files).then(
      () => json(res, 200, {ok: true}),
      (error: unknown) => json(res, 502, {error: error instanceof Error ? error.message : String(error)}),
    );
    return;
  }

  const font = /^\/fonts\/([^/]+\.(ttf|otf))$/.exec(path);
  if (font && req.method === 'GET' && existsSync(join(fontsDir, font[1]))) {
    res.setHeader('Content-Type', `font/${font[2]}`);
    createReadStream(join(fontsDir, font[1])).pipe(res);
    return;
  }

  next();
};

export function downloads(): Plugin {
  return {
    name: 'nerd-font-downloads',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
