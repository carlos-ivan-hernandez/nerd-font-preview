import {type RefObject, useEffect, useRef} from 'react';
import {type Downloads, formatSize} from '../lib/downloads';
import {type Font} from '../lib/fonts';

type Props = {
  fonts: Font[];
  selected: Font | undefined;
  onSelect: (font: Font) => void;
  query: string;
  onQuery: (query: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  total: number;
  downloads: Downloads;
  // Whether the selected font is still loading.
  loading: boolean;
};

export function Sidebar({fonts, selected, onSelect, query, onQuery, searchRef, total, downloads, loading}: Props) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({block: 'nearest'});
  }, [selected]);

  return (
    <aside className='sidebar'>
      <header className='brand'>
        <h1>Nerd Font Preview</h1>
        <p>
          {fonts.length === total ? total : `${fonts.length} of ${total}`} fonts · <span className='dot on' />{' '}
          {total - downloads.missing.length} downloaded
        </p>
        <p>
          <kbd>↑</kbd>
          <kbd>↓</kbd> to browse
        </p>
      </header>
      <DownloadAll downloads={downloads} />
      <input
        aria-label='Search fonts'
        className='search'
        onChange={event => onQuery(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Escape') {
            onQuery('');
            event.currentTarget.blur();
          }
          if (event.key === 'Enter' && fonts[0]) {
            onSelect(fonts[0]);
            event.currentTarget.blur();
          }
        }}
        placeholder='Search  /'
        ref={searchRef}
        spellCheck={false}
        type='search'
        value={query}
      />
      <nav className='font-list'>
        {fonts.map(font => {
          const active = font === selected;
          const job = font.archive && downloads.jobs[font.group];
          const downloaded = downloads.isDownloaded(font);
          // Archive-only fonts need the dev server to fetch them before they can be shown at all.
          const needsServer = font.archive && downloads.api === 'available' && !downloads.isAvailable(font);
          return (
            <div
              className='font-row'
              key={font.id}
            >
              <button
                aria-current={active}
                className='font-item'
                onClick={() => onSelect(font)}
                ref={active ? activeRef : undefined}
                type='button'
              >
                <span
                  className={downloaded ? 'dot on' : 'dot'}
                  title={downloaded ? 'Downloaded' : 'Not downloaded yet'}
                />
                <span className='font-name'>{font.id}</span>
                {active && loading ? (
                  <span className='spinner delayed' />
                ) : (
                  !needsServer && font.group !== font.id && <span className='font-group'>{font.group}</span>
                )}
              </button>
              {needsServer && (
                <button
                  className={job?.state === 'error' ? 'get error' : 'get'}
                  disabled={job?.state === 'downloading'}
                  onClick={() => downloads.downloadArchive(font.group)}
                  title={
                    job?.state === 'error'
                      ? `${job.message}. Click to try again.`
                      : `Download the ${font.group} release archive`
                  }
                  type='button'
                >
                  {job?.state === 'downloading'
                    ? 'Downloading…'
                    : job?.state === 'error'
                      ? 'Retry'
                      : `↓ ${formatSize(font.archive!.size)}`}
                </button>
              )}
            </div>
          );
        })}
        {fonts.length === 0 && <p className='empty'>No fonts match “{query}”.</p>}
      </nav>
    </aside>
  );
}

function DownloadAll({downloads}: {downloads: Downloads}) {
  const {api, missing, missingSize, progress, downloadAll} = downloads;
  if (api === 'checking' || (missing.length === 0 && !progress)) return null;
  return (
    <div className='download-all'>
      {progress ? (
        <>
          <p>
            Downloading… {progress.done} of {progress.total}
          </p>
          <progress
            max={progress.total}
            value={progress.done}
          />
        </>
      ) : (
        <>
          <p>
            {missing.length} fonts aren't downloaded yet ({formatSize(missingSize)})
          </p>
          <button
            className='button primary'
            onClick={downloadAll}
            type='button'
          >
            Download all
          </button>
        </>
      )}
    </div>
  );
}
