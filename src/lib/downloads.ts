import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {fetchFont, useCached} from './cache';
import {type Font, fonts, fontUrl} from './fonts';

// A font is downloaded once its file is in the browser's cache (src/lib/cache.ts). Fonts that are only in
// release archives also need the dev server (scripts/downloads.ts) to fetch their archive first; once it has,
// they load from localhost and count as downloaded. When the app is served without the dev server, as a
// static build, those fonts are expected to be in fonts/ already.

type Api = 'checking' | 'available' | 'none';

export type Job = {state: 'downloading'} | {state: 'error'; message: string};

// How many fonts "Download all" fetches from jsDelivr at once.
const PARALLEL = 4;

const endpoint = `${import.meta.env.BASE_URL}api/downloads`;

export function formatSize(bytes: number) {
  return `${Math.max(1, Math.round(bytes / 1024 / 1024))} MB`;
}

export function useDownloads(mono: boolean) {
  const [api, setApi] = useState<Api>('checking');
  const [onServer, setOnServer] = useState<Set<string>>(new Set());
  const [jobs, setJobs] = useState<Record<string, Job>>({});
  const [progress, setProgress] = useState<{done: number; total: number} | null>(null);
  const running = useRef(new Set<string>());
  const isCached = useCached();

  useEffect(() => {
    fetch(endpoint)
      .then(response => (response.ok ? (response.json() as Promise<{downloaded: string[]}>) : Promise.reject()))
      .then(
        body => {
          setOnServer(new Set(body.downloaded));
          setApi('available');
        },
        () => setApi('none'),
      );
  }, []);

  // Whether the font can be shown at all: archive-only fonts need the dev server to have fetched them.
  const isAvailable = useCallback(
    (font: Font) => !font.archive || api === 'none' || onServer.has(font.group),
    [api, onServer],
  );

  const isDownloaded = useCallback(
    (font: Font) => (font.archive ? api !== 'checking' && isAvailable(font) : isCached(fontUrl(font, mono))),
    [api, isAvailable, isCached, mono],
  );

  const downloadArchive = useCallback(async (group: string) => {
    if (running.current.has(group)) return;
    running.current.add(group);
    setJobs(current => ({...current, [group]: {state: 'downloading'}}));
    try {
      const response = await fetch(`${endpoint}/${encodeURIComponent(group)}`, {method: 'POST'});
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {error?: string};
        throw new Error(body.error ?? `Download failed (${response.status})`);
      }
      setOnServer(current => new Set(current).add(group));
      setJobs(({[group]: _done, ...rest}) => rest);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setJobs(current => ({...current, [group]: {state: 'error', message}}));
    } finally {
      running.current.delete(group);
    }
  }, []);

  const missing = useMemo(() => fonts.filter(font => !isDownloaded(font)), [isDownloaded]);
  const missingArchives = useMemo(
    () => [...new Map(missing.filter(font => font.archive).map(font => [font.group, font.archive!.size]))],
    [missing],
  );
  const missingSize = useMemo(
    () =>
      missing.reduce((sum, font) => sum + (font.archive ? 0 : (mono && font.monoSize) || font.size || 0), 0) +
      missingArchives.reduce((sum, [, size]) => sum + size, 0),
    [missing, missingArchives, mono],
  );

  const downloadAll = useCallback(async () => {
    const fromCdn = missing.filter(font => !font.archive);
    const archives = missingArchives.map(([group]) => group);
    let done = 0;
    const total = fromCdn.length + archives.length;
    const step = () => setProgress({done: ++done, total});
    setProgress({done, total});

    // A few jsDelivr downloads at a time, and the archives one at a time alongside them, so GitHub isn't hit
    // all at once. A font that fails is just left undownloaded.
    const queue = [...fromCdn];
    const worker = async () => {
      for (let font = queue.shift(); font; font = queue.shift()) {
        // oxlint-disable-next-line no-await-in-loop
        await fetchFont(fontUrl(font, mono)).catch(() => {});
        step();
      }
    };
    const archiveWorker = async () => {
      for (const group of archives) {
        // oxlint-disable-next-line no-await-in-loop
        await downloadArchive(group);
        step();
      }
    };
    await Promise.all([...Array.from({length: PARALLEL}, worker), archiveWorker()]);
    setProgress(null);
  }, [missing, missingArchives, mono, downloadArchive]);

  return {
    api,
    jobs,
    missing,
    missingSize,
    progress,
    isAvailable,
    isDownloaded,
    downloadArchive,
    downloadAll,
  };
}

export type Downloads = ReturnType<typeof useDownloads>;
