import {useEffect, useState} from 'react';
import data from '../fonts.json';
import {fetchFont} from './cache';

export type Font = {
  // The name before "Nerd Font", e.g. "MesloLGS" for "MesloLGS Nerd Font".
  id: string;
  // The release archive it comes from, e.g. "Meslo".
  group: string;
  // A jsDelivr URL, or a path under public/ for fonts that are only in release archives.
  url: string;
  monoUrl: string | null;
  download: string;
  // Set for fonts that are only in a release archive, which has to be downloaded before they can be shown.
  archive?: {name: string; size: number};
  // File sizes in bytes, for fonts loaded from jsDelivr.
  size?: number;
  monoSize?: number | null;
};

export const tag = data.tag;
export const fonts: Font[] = data.fonts;

export function fontName(font: Font, mono: boolean) {
  return `${font.id} Nerd Font${mono && font.monoUrl ? ' Mono' : ''}`;
}

export function fontUrl(font: Font, mono: boolean) {
  const url = mono && font.monoUrl ? font.monoUrl : font.url;
  return url.startsWith('https://') ? url : import.meta.env.BASE_URL + url;
}

export function fileName(font: Font, mono: boolean) {
  const url = fontUrl(font, mono);
  return url.slice(url.lastIndexOf('/') + 1);
}

// Each font file is registered once under its own family name, so switching back to a font is instant.
const loads = new Map<string, Promise<string>>();

export function loadFont(font: Font, mono: boolean) {
  const url = fontUrl(font, mono);
  let load = loads.get(url);
  if (!load) {
    const family = `preview ${fileName(font, mono)}`;
    load = fetchFont(url)
      .then(bytes => new FontFace(family, bytes).load())
      .then(face => {
        document.fonts.add(face);
        return family;
      });
    load.catch(() => loads.delete(url));
    loads.set(url, load);
  }
  return load;
}

type State = {family: string | null; loading: boolean; error: string | null};

// Keeps showing the last loaded font while the next one downloads, so the preview never falls back to a
// system font.
export function useFont(font: Font | undefined, mono: boolean, available: boolean, neighbors: Font[]) {
  const [state, setState] = useState<State>({family: null, loading: true, error: null});

  useEffect(() => {
    if (!font || !available) return;
    let current = true;
    setState(previous => ({...previous, loading: true, error: null}));
    loadFont(font, mono).then(
      family => {
        if (!current) return;
        setState({family, loading: false, error: null});
        // Warm up the fonts next to this one so stepping through the list feels instant.
        for (const neighbor of neighbors) loadFont(neighbor, mono).catch(() => {});
      },
      () =>
        current &&
        setState(previous => ({...previous, loading: false, error: `Couldn't load ${fontName(font, mono)}`})),
    );
    return () => {
      current = false;
    };
    // neighbors changes identity every render; the font and variant are what matter.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [font, mono, available]);

  return state;
}
