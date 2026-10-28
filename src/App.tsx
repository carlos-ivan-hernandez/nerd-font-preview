import {useEffect, useMemo, useRef, useState} from 'react';
import {Sidebar} from './components/Sidebar';
import {Terminal} from './components/Terminal';
import {formatSize, useDownloads} from './lib/downloads';
import {fileName, fontName, fonts, fontUrl, tag, useFont} from './lib/fonts';
import {nf} from './lib/glyphs';
import {render, type SceneId, scenes} from './lib/scenes';
import {useStoredState} from './lib/storage';
import {themes} from './lib/themes';

const SAMPLE = `Nerd Fonts patch developer fonts with icons: ${nf.faApple} ${nf.faLinux} ${nf.faGithub} ${nf.setiTypescript} ${nf.setiPython} ${nf.setiRust} ${nf.devVim} ${nf.mdGit}

const answer = items.filter(x => x !== null).length >= 42;
0O o0 1lI| {[()]} <= >= != === -> => ::`;

export function App() {
  const [selectedId, setSelectedId] = useStoredState('font', 'MesloLGS');
  const [mono, setMono] = useStoredState('mono', false);
  const [size, setSize] = useStoredState('size', 14);
  const [lineHeight, setLineHeight] = useStoredState('lineHeight', 1.25);
  const [ligatures, setLigatures] = useStoredState('ligatures', true);
  const [themeId, setThemeId] = useStoredState('terminalTheme', themes[0].id);
  const [scene, setScene] = useStoredState<SceneId>('scene', 'shell');
  const [customText, setCustomText] = useStoredState('customText', SAMPLE);
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return fonts.filter(font => words.every(word => `${font.id} ${font.group}`.toLowerCase().includes(word)));
  }, [query]);
  const selected = fonts.find(font => font.id === selectedId) ?? fonts[0];
  const index = filtered.indexOf(selected);
  const downloads = useDownloads(mono);
  const available = downloads.isAvailable(selected);
  const neighbors = [filtered[index - 1], filtered[index + 1]].filter(
    font => font !== undefined && downloads.isAvailable(font),
  );
  const {family, loading, error} = useFont(selected, mono, available, neighbors);
  const job = downloads.jobs[selected.group];
  const theme = themes.find(item => item.id === themeId) ?? themes[0];
  const lines = useMemo(() => render(scene, customText), [scene, customText]);
  const name = fontName(selected, mono);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (target.matches('input:not([type=range]):not([type=checkbox]), textarea, select')) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const tab = scenes[Number(event.key) - 1];
      const step = {ArrowDown: 1, j: 1, ArrowUp: -1, k: -1}[event.key];
      if (tab) {
        setScene(tab.id);
      } else if (step && filtered.length > 0) {
        event.preventDefault();
        const next = filtered[Math.min(filtered.length - 1, Math.max(0, (index === -1 ? -step : index) + step))];
        setSelectedId(next.id);
      } else if (event.key === '/') {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key === 'm') {
        setMono(value => !value);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [filtered, index, setSelectedId, setScene, setMono]);

  async function copyName() {
    try {
      await navigator.clipboard.writeText(name);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access was refused; the name is still visible to copy by hand.
    }
  }

  return (
    <div className='app'>
      <Sidebar
        fonts={filtered}
        onQuery={setQuery}
        onSelect={font => setSelectedId(font.id)}
        query={query}
        searchRef={searchRef}
        selected={selected}
        total={fonts.length}
        downloads={downloads}
        loading={available && loading}
      />
      <main className='main'>
        <header className='font-header'>
          <div className='font-title'>
            <h2>
              {name}
              {available && loading && <span className='spinner delayed' />}
            </h2>
            <p>
              {fileName(selected, mono)} · from <span className='mono'>{selected.group}</span> · Nerd Fonts {tag}
            </p>
          </div>
          <div className='actions'>
            <button
              className='button'
              onClick={copyName}
              type='button'
            >
              {copied ? 'Copied' : 'Copy name'}
            </button>
            {available && (
              <a
                className='button'
                download
                href={fontUrl(selected, mono)}
              >
                Download file
              </a>
            )}
            <a
              className='button primary'
              href={selected.download}
            >
              Download {selected.group}.zip
            </a>
          </div>
        </header>

        <div className='controls'>
          <div
            className='segmented'
            role='group'
            aria-label='Variant'
          >
            <button
              aria-pressed={!mono}
              onClick={() => setMono(false)}
              title='Icons can be wider than one cell'
              type='button'
            >
              Nerd Font
            </button>
            <button
              aria-pressed={mono}
              disabled={!selected.monoUrl}
              onClick={() => setMono(true)}
              title='Every icon fits in one cell (m)'
              type='button'
            >
              Mono
            </button>
          </div>
          <label className='control'>
            <span>Theme</span>
            <select
              onChange={event => setThemeId(event.target.value)}
              value={theme.id}
            >
              {themes.map(item => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className='control'>
            <span>Size</span>
            <input
              max={24}
              min={9}
              onChange={event => setSize(Number(event.target.value))}
              step={1}
              type='range'
              value={size}
            />
            <output>{size}px</output>
          </label>
          <label className='control'>
            <span>Line height</span>
            <input
              max={1.8}
              min={1}
              onChange={event => setLineHeight(Number(event.target.value))}
              step={0.05}
              type='range'
              value={lineHeight}
            />
            <output>{lineHeight.toFixed(2)}</output>
          </label>
          <label className='control check'>
            <input
              checked={ligatures}
              onChange={event => setLigatures(event.target.checked)}
              type='checkbox'
            />
            <span>Ligatures</span>
          </label>
        </div>

        {scene === 'custom' && (
          <textarea
            aria-label='Custom text'
            className='custom-text'
            onChange={event => setCustomText(event.target.value)}
            rows={4}
            spellCheck={false}
            value={customText}
          />
        )}

        <Terminal
          error={available ? error : null}
          family={family}
          ligatures={ligatures}
          lineHeight={lineHeight}
          lines={lines}
          loading={available && loading ? name : null}
          overlay={
            !available &&
            selected.archive && (
              <div className='notice'>
                <h3>{fontName(selected, mono)} isn't downloaded yet</h3>
                {downloads.api === 'checking' ? (
                  <p>Checking which fonts are downloaded…</p>
                ) : (
                  <>
                    <p>
                      It's only published in the {selected.group} release archive ({formatSize(selected.archive.size)}),
                      which the dev server downloads for you.
                    </p>
                    {job?.state === 'error' && <p className='notice-error'>{job.message}</p>}
                    <button
                      className='button primary'
                      disabled={job?.state === 'downloading'}
                      onClick={() => downloads.downloadArchive(selected.group)}
                      type='button'
                    >
                      {job?.state === 'downloading'
                        ? 'Downloading…'
                        : job?.state === 'error'
                          ? 'Try again'
                          : `Download ${selected.group}`}
                    </button>
                  </>
                )}
              </div>
            )
          }
          onScene={setScene}
          scene={scene}
          size={size}
          theme={theme}
        />
      </main>
    </div>
  );
}
