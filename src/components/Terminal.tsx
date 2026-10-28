import {type CSSProperties, type ReactNode} from 'react';
import {type SceneId, scenes} from '../lib/scenes';
import {type Line, type Seg} from '../lib/term';
import {type Color, type Theme} from '../lib/themes';

type Props = {
  lines: Line[];
  family: string | null;
  size: number;
  lineHeight: number;
  ligatures: boolean;
  theme: Theme;
  scene: SceneId;
  onScene: (scene: SceneId) => void;
  // The name of the font being loaded, if one is.
  loading: string | null;
  error: string | null;
  // Shown over the screen instead of the font, e.g. when the font has to be downloaded first.
  overlay?: ReactNode;
};

export function Terminal({
  lines,
  family,
  size,
  lineHeight,
  ligatures,
  theme,
  scene,
  onScene,
  loading,
  error,
  overlay,
}: Props) {
  const vars = Object.fromEntries(Object.entries(theme.colors).map(([name, value]) => [`--t-${name}`, value]));
  const style = {
    ...vars,
    fontFamily: family ? `"${family}", monospace` : 'monospace',
    fontSize: size,
    lineHeight,
    '--lh': lineHeight,
    fontVariantLigatures: ligatures ? 'normal' : 'none',
    fontFeatureSettings: ligatures ? 'normal' : '"calt" 0, "liga" 0',
  } as CSSProperties;
  const title = scenes.find(item => item.id === scene)?.title;

  return (
    <div
      className='window'
      style={vars as CSSProperties}
    >
      <div className='titlebar'>
        <div className='lights'>
          <span />
          <span />
          <span />
        </div>
        <div className='title'>{title}</div>
      </div>
      <div
        className='tabs'
        role='tablist'
      >
        {scenes.map((item, i) => (
          <button
            aria-selected={item.id === scene}
            className='tab'
            key={item.id}
            onClick={() => onScene(item.id)}
            role='tab'
            type='button'
          >
            <span className='tab-key'>{i + 1}</span>
            {item.name}
          </button>
        ))}
      </div>
      <div className={loading ? 'screen-wrap loading' : 'screen-wrap'}>
        <div
          className='screen'
          style={style}
        >
          {lines.map((line, i) => (
            <TermLine
              // Lines are static per scene, so their position is a stable key.
              // oxlint-disable-next-line react/no-array-index-key
              key={i}
              line={line}
            />
          ))}
        </div>
        {overlay && <div className='overlay'>{overlay}</div>}
        {error ? (
          <div className='status error'>{error}</div>
        ) : (
          loading && (
            <div
              className='status'
              role='status'
            >
              <span className='spinner' />
              Loading {loading}…
            </div>
          )
        )}
      </div>
    </div>
  );
}

function color(name: Color | undefined) {
  return name && `var(--t-${name})`;
}

function TermLine({line}: {line: Line}) {
  const flex = line.some(seg => seg.fill);
  return (
    <div className={flex ? 'line flex' : 'line'}>
      {line.map((seg, i) => (
        <TermSeg
          // oxlint-disable-next-line react/no-array-index-key
          key={i}
          seg={seg}
        />
      ))}
    </div>
  );
}

function TermSeg({seg}: {seg: Seg}) {
  if (seg.cursor) return <span className='cursor'>{seg.t}</span>;
  return (
    <span
      className={seg.fill ? 'fill' : undefined}
      style={{
        color: color(seg.fg),
        background: color(seg.bg),
        fontWeight: seg.bold ? 700 : undefined,
        fontStyle: seg.italic ? 'italic' : undefined,
        opacity: seg.dim ? 0.6 : undefined,
        textDecoration: seg.underline ? 'underline' : undefined,
      }}
    >
      {seg.t}
    </span>
  );
}
