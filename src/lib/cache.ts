import {useSyncExternalStore} from 'react';
import data from '../fonts.json';

// Font files are kept in Cache Storage, so a font downloads once and is instant from then on, and the app
// knows which fonts are downloaded. Cache Storage only exists in secure contexts (https or localhost); opened
// any other way, fonts are fetched every time and nothing counts as downloaded.

const CACHE = `nerd-fonts-${data.tag}`;

let cached = new Set<string>();
const listeners = new Set<() => void>();

function absolute(url: string) {
  return new URL(url, location.href).href;
}

function update(next: Set<string>) {
  cached = next;
  for (const listener of listeners) listener();
}

async function open() {
  return typeof caches === 'undefined' ? null : caches.open(CACHE);
}

open()
  .then(async cache => {
    if (!cache) return;
    const keys = await cache.keys();
    update(new Set([...cached, ...keys.map(request => request.url)]));
  })
  .catch(() => {});

// Downloads a font file (or reads it from the cache) and returns its bytes.
export async function fetchFont(url: string): Promise<ArrayBuffer> {
  const key = absolute(url);
  const cache = await open().catch(() => null);
  const hit = await cache?.match(key);
  if (hit) return hit.arrayBuffer();
  // A stalled request would otherwise leave the font loading forever.
  const response = await fetch(key, {signal: AbortSignal.timeout(120_000)});
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  if (cache) {
    await cache.put(key, response.clone());
    update(new Set(cached).add(key));
  }
  return response.arrayBuffer();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Returns a function that says whether a font file is downloaded, re-rendering when that changes.
export function useCached() {
  const set = useSyncExternalStore(subscribe, () => cached);
  return (url: string) => set.has(absolute(url));
}
