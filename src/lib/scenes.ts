import {glyphSets, nf} from './glyphs';
import {box, cursor, fill, type Line, pad, padStart, s, type Seg, sideBySide} from './term';
import {type Color} from './themes';

export type SceneId = 'shell' | 'editor' | 'monitor' | 'glyphs' | 'custom';

export const scenes: {id: SceneId; name: string; title: string}[] = [
  {id: 'shell', name: 'zsh', title: '~/projects/api'},
  {id: 'editor', name: 'nvim', title: 'nvim src/server.ts'},
  {id: 'monitor', name: 'btop', title: 'btop'},
  {id: 'glyphs', name: 'glyphs', title: 'Glyph test'},
  {id: 'custom', name: 'custom', title: 'Your text'},
];

export function render(scene: SceneId, customText: string): Line[] {
  switch (scene) {
    case 'shell':
      return shell();
    case 'editor':
      return editor();
    case 'monitor':
      return monitor();
    case 'glyphs':
      return glyphs();
    case 'custom':
      return custom(customText);
  }
}

// Powerline segments: each one's background flows into the next through a  separator.
function powerline(segments: {t: string; bg: Color; fg?: Color}[], end: Color = 'bg'): Line {
  return segments.flatMap((seg, i) => [
    s(` ${seg.t} `, seg.fg ?? 'black', {bg: seg.bg}),
    s(nf.plLeftHardDivider, seg.bg, {bg: segments[i + 1]?.bg ?? end}),
  ]);
}

function rightPowerline(segments: {t: string; bg: Color; fg?: Color}[]): Line {
  return segments.flatMap((seg, i) => [
    s(nf.plRightHardDivider, seg.bg, {bg: segments[i - 1]?.bg ?? 'bg'}),
    s(` ${seg.t} `, seg.fg ?? 'black', {bg: seg.bg}),
  ]);
}

function prompt(dir: string, git: {branch: string; dirty?: string}, right: Line = []): Line[] {
  const left = powerline([
    {t: nf.faApple, bg: 'white'},
    {t: `${nf.faFolderOpen} ${dir}`, bg: 'blue'},
    {t: `${nf.plBranch} ${git.branch}${git.dirty ? ` ${git.dirty}` : ''}`, bg: git.dirty ? 'yellow' : 'green'},
  ]);
  return [[...left, fill, ...right]];
}

function permissions(mode: string): Seg[] {
  const colors: Record<string, Color> = {d: 'blue', r: 'yellow', w: 'red', x: 'green', '-': 'gray', '.': 'fg'};
  return mode.split('').map(char => s(char, colors[char], {bold: char === 'd'}));
}

function shell(): Line[] {
  const files: [string, string, string, string, string, Color, string][] = [
    ['drwxr-xr-x', '-', '28 Oct 09:12', '-M', nf.customFolder, 'blue', 'src'],
    ['drwxr-xr-x', '-', '27 Oct 18:40', '--', nf.customFolder, 'blue', 'tests'],
    ['.rw-r--r--', '64', '22 Oct 14:20', '-N', nf.setiConfig, 'gray', '.env.example'],
    ['.rw-r--r--', '261', '22 Oct 14:20', '--', nf.setiDocker, 'blue', 'Dockerfile'],
    ['.rw-r--r--', '1.1k', '22 Oct 14:20', '--', nf.setiLicense, 'yellow', 'LICENSE'],
    ['.rw-r--r--', '1.2k', '28 Oct 09:14', '-M', nf.setiNpm, 'red', 'package.json'],
    ['.rw-r--r--', '98k', '27 Oct 18:40', '--', nf.setiLock, 'gray', 'pnpm-lock.yaml'],
    ['.rw-r--r--', '3.4k', '28 Oct 09:02', '-M', nf.setiMarkdown, 'white', 'README.md'],
    ['.rw-r--r--', '412', '26 Oct 11:03', '--', nf.setiJson, 'yellow', 'tsconfig.json'],
  ];
  const ls: Line[] = files.map(([mode, size, date, git, icon, color, name]) => [
    ...permissions(mode),
    s(` ${padStart(size, 4)} `, size === '-' ? 'gray' : 'green'),
    s('dev ', 'yellow'),
    s(`${date} `, 'blue'),
    s(git[0], 'gray'),
    s(git[1], git[1] === 'M' ? 'blue' : git[1] === 'N' ? 'green' : 'gray'),
    s(` ${icon} `, color),
    s(name, color, {bold: mode.startsWith('d')}),
  ]);

  const log: Line[] = [
    [
      s('* ', 'red'),
      s('a1f3c9e ', 'yellow'),
      s('(', 'yellow'),
      s('HEAD -> ', 'cyan', {bold: true}),
      s('main', 'green', {bold: true}),
      s(', ', 'yellow'),
      s('origin/main', 'red', {bold: true}),
      s(') ', 'yellow'),
      s('Add rate limiting to /api/search'),
    ],
    [s('* ', 'red'), s('7b2d410 ', 'yellow'), s('Fix off-by-one in pagination (page >= 1)')],
    [s('*   ', 'red'), s('3e9a0c2 ', 'yellow'), s("Merge branch 'feature/oauth'")],
    [s('|', 'red'), s('\\  ', 'green')],
    [s('| ', 'red'), s('* ', 'green'), s('92cd7e1 ', 'yellow'), s('Handle the OAuth callback -> /auth/done')],
    [s('|', 'red'), s('/  ', 'green')],
    [
      s('* ', 'red'),
      s('5f61b8d ', 'yellow'),
      s('(', 'yellow'),
      s('tag: v1.4.0', 'yellow', {bold: true}),
      s(') ', 'yellow'),
      s('Bump vite to 8.3'),
    ],
  ];

  const time = (t: string): Line =>
    rightPowerline([
      {t: `${nf.faCheck}`, bg: 'surface', fg: 'green'},
      {t: `${nf.mdNodejs} 24.18`, bg: 'surface', fg: 'green'},
      {t: `${nf.faClockO} ${t}`, bg: 'surface', fg: 'white'},
    ]);

  return [
    ...prompt('~/projects/api', {branch: 'main', dirty: '!3 ?1'}, time('09:14:02')),
    [s('❯ ', 'green', {bold: true}), s('eza', 'green'), s(' -l --icons --git', 'cyan')],
    ...ls,
    [],
    ...prompt('~/projects/api', {branch: 'main', dirty: '!3 ?1'}, time('09:14:09')),
    [s('❯ ', 'green', {bold: true}), s('git', 'green'), s(' log --oneline --graph -5', 'cyan')],
    ...log,
    [],
    ...prompt('~/projects/api', {branch: 'main', dirty: '!3 ?1'}, time('09:14:21')),
    [s('❯ ', 'green', {bold: true}), s('pnpm', 'green'), s(' test', 'cyan')],
    [s(' RUN ', 'black', {bg: 'blue', bold: true}), s(' v4.1.0 ', 'blue'), s('~/projects/api', 'gray')],
    [],
    [s(` ${nf.faCheck} `, 'green'), s('tests/search.test.ts ', 'fg'), s('(12 tests) ', 'gray'), s('38ms', 'yellow')],
    [s(` ${nf.faCheck} `, 'green'), s('tests/limit.test.ts ', 'fg'), s('(4 tests) ', 'gray'), s('9ms', 'yellow')],
    [
      s(` ${nf.faTimes} `, 'red'),
      s('tests/auth.test.ts ', 'fg'),
      s('(7 tests | ', 'gray'),
      s('1 failed', 'red'),
      s(') ', 'gray'),
      s('112ms', 'yellow'),
    ],
    [s('   ', 'red'), s(`${nf.faTimes} `, 'red'), s('rejects an expired token', 'red')],
    [s('     → expected 401 to be 200 ', 'red', {dim: true}), s('// Object.is equality', 'gray')],
    [],
    [
      s(' Tests  ', 'gray'),
      s('1 failed', 'red', {bold: true}),
      s(' | ', 'gray'),
      s('22 passed', 'green', {bold: true}),
      s(' (23)', 'gray'),
    ],
    [],
    ...prompt(
      '~/projects/api',
      {branch: 'main', dirty: '!3 ?1'},
      rightPowerline([
        {t: `${nf.faTimes} 1`, bg: 'red', fg: 'black'},
        {t: `${nf.faHourglassHalf} 1.4s`, bg: 'yellow', fg: 'black'},
        {t: `${nf.faClockO} 09:14:23`, bg: 'surface', fg: 'white'},
      ]),
    ),
    [s('❯ ', 'red', {bold: true}), s('pnpm', 'green'), s(' dev'), cursor, s(' --host --port 5173', 'gray')],
  ];
}

const code = `import {createServer} from 'node:http';
import {rateLimit} from './limit';
import {search, type Item} from './search';

const PORT = Number(process.env.PORT ?? 3000);
const PAGE_SIZE = 20;

// Pages start at 1, so anything <= 0 falls back to the first page.
export const handler = async (req: Request): Promise<Response> => {
  if (req.method !== 'GET') return new Response(null, {status: 405});
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const items: Item[] = await search(url.searchParams.get('q') ?? '', page);
  const next = items.length === PAGE_SIZE ? page + 1 : null;
  return Response.json({items, next});
};

createServer(rateLimit(handler)).listen(PORT, () => {
  console.log(\`listening on :\${PORT} -> http://localhost:\${PORT}\`);
});`;

const KEYWORDS = new Set([
  'import',
  'from',
  'const',
  'export',
  'async',
  'await',
  'return',
  'if',
  'new',
  'null',
  'type',
]);

// Just enough of a TypeScript highlighter for the sample above.
function highlight(source: string): Line {
  const token = /(\/\/.*$)|('[^']*'|`(?:[^`\\]|\\.)*`)|(\b\d+\b)|(\b[A-Za-z_]\w*\b)|(\s+)|(.)/g;
  const line: Line = [];
  for (const match of source.matchAll(token)) {
    const [text, comment, string, number, word] = match;
    if (comment) line.push(s(text, 'gray', {italic: true}));
    else if (string) line.push(s(text, 'green'));
    else if (number) line.push(s(text, 'orange'));
    else if (word && KEYWORDS.has(word))
      line.push(s(text, 'magenta', {italic: word === 'import' || word === 'export'}));
    else if (word && /^[A-Z][A-Z_]+$/.test(word)) line.push(s(text, 'orange'));
    else if (word && /^[A-Z]/.test(word)) line.push(s(text, 'yellow'));
    else if (word && source[match.index + text.length] === '(') line.push(s(text, 'blue'));
    else if (word) line.push(s(text, 'fg'));
    else line.push(s(text, /[=<>!?|&+:-]/.test(text) ? 'cyan' : 'white'));
  }
  return line;
}

function editor(): Line[] {
  const treeWidth = 28;
  const tree: Line[] = [
    [s(` ${nf.customFolderOpen} api`, 'blue', {bold: true})],
    [s('  ', 'gray'), s(`${nf.customFolderOpen} src`, 'blue')],
    [s('  │ ', 'gray'), s(`${nf.setiTypescript} `, 'blue'), s('limit.ts')],
    [s('  │ ', 'gray'), s(`${nf.setiTypescript} `, 'blue'), s('search.ts')],
    [
      s('  │ ', 'gray'),
      s(`${nf.setiTypescript} `, 'blue'),
      s('server.ts', 'fg', {bold: true}),
      fill,
      s(`${nf.octDiffModified} `, 'yellow'),
    ],
    [s('  ', 'gray'), s(`${nf.customFolder} tests`, 'blue')],
    [s('  ', 'gray'), s(`${nf.setiConfig} `, 'gray'), s('.env.example'), fill, s('? ', 'green')],
    [s('  ', 'gray'), s(`${nf.setiDocker} `, 'blue'), s('Dockerfile')],
    [s('  ', 'gray'), s(`${nf.setiNpm} `, 'red'), s('package.json'), fill, s(`${nf.octDiffModified} `, 'yellow')],
    [s('  ', 'gray'), s(`${nf.setiMarkdown} `, 'white'), s('README.md')],
    [s('  ', 'gray'), s(`${nf.setiJson} `, 'yellow'), s('tsconfig.json')],
  ];
  const lines = code.split('\n');
  const current = 12;
  const buffers: Line = [
    s(` ${nf.setiTypescript} server.ts `, 'fg', {bg: 'bg', bold: true}),
    s(`${nf.faCircle} `, 'yellow', {bg: 'bg'}),
    s(` ${nf.setiTypescript} search.ts `, 'gray', {bg: 'surface'}),
    s(` ${nf.setiJson} package.json `, 'gray', {bg: 'surface'}),
    s('', undefined, {bg: 'surface', fill: true}),
  ];
  const body: Line[] = Array.from({length: Math.max(tree.length, lines.length + 2)}, (_, i) => {
    const sidebar = pad(tree[i] ?? [], treeWidth);
    if (i >= lines.length) return [...sidebar, s('│', 'gray'), s('  ~', 'gray')];
    const isCurrent = i + 1 === current;
    const sign = i + 1 === 12 || i + 1 === 14 ? s('▎', 'yellow') : i + 1 === 13 ? s('▎', 'green') : s(' ');
    const diagnostic =
      i + 1 === 13 ? [s(`  ${nf.codWarning} 'Item' is declared but never read`, 'yellow', {italic: true})] : [];
    return [
      ...sidebar,
      s('│', 'gray'),
      sign,
      s(padStart(isCurrent ? String(current) : String(Math.abs(i + 1 - current)), 3), isCurrent ? 'yellow' : 'gray', {
        bold: isCurrent,
      }),
      s(' '),
      ...highlight(lines[i]),
      ...diagnostic,
    ];
  });
  const status: Line = [
    s(' NORMAL ', 'black', {bg: 'blue', bold: true}),
    s(nf.plLeftHardDivider, 'blue', {bg: 'surface'}),
    s(` ${nf.devGitBranch} main `, 'fg', {bg: 'surface'}),
    s(`${nf.octDiffAdded} 1 `, 'green', {bg: 'surface'}),
    s(`${nf.octDiffModified} 2 `, 'yellow', {bg: 'surface'}),
    s(nf.plLeftHardDivider, 'surface', {bg: 'bg'}),
    s(` ${nf.setiTypescript} server.ts `, 'fg'),
    s(`${nf.codWarning} 1 `, 'yellow'),
    fill,
    s('utf-8  ', 'gray'),
    s(`${nf.faApple}  `, 'gray'),
    s(`${nf.setiTypescript} typescript `, 'blue'),
    s(nf.plRightHardDivider, 'surface'),
    s(' 63% ', 'fg', {bg: 'surface'}),
    s(nf.plRightHardDivider, 'blue', {bg: 'surface'}),
    s(` ${nf.plLineNumber} 12:9 `, 'black', {bg: 'blue', bold: true}),
  ];
  return [
    [...pad([s(' Explorer', 'fg', {bold: true})], treeWidth, {bg: 'surface'}), s('│', 'gray'), ...buffers],
    ...body,
    status,
    [s(':w', 'fg')],
  ];
}

// Bars and graphs built from block characters.
const BLOCKS = ' ▁▂▃▄▅▆▇█';

function sparkline(values: number[], color: Color): Seg {
  return s(values.map(v => BLOCKS[Math.round(v * 8)]).join(''), color);
}

function meter(value: number, cells: number): Line {
  const filled = Math.round(value * cells);
  const color: Color = value > 0.8 ? 'red' : value > 0.5 ? 'yellow' : 'green';
  return [s('■'.repeat(filled), color), s('■'.repeat(cells - filled), 'surface')];
}

function monitor(): Line[] {
  const wave = (offset: number, scale: number, n = 32) =>
    Array.from({length: n}, (_, i) =>
      Math.min(1, Math.max(0.05, (Math.sin(i / 3 + offset) + 1.2) * scale * (0.6 + ((i * 7) % 5) / 10))),
    );
  const cores = [0.62, 0.34, 0.88, 0.21, 0.47, 0.73, 0.15, 0.56];
  const cpu = box(
    `${nf.mdCpu64Bit} cpu`,
    52,
    [
      [s(' '), sparkline(wave(0, 0.45), 'green'), s('  Apple M3 Pro', 'white')],
      [s(' '), sparkline(wave(1, 0.4), 'yellow'), s('  12 cores', 'gray')],
      [s(' '), sparkline(wave(2, 0.35), 'red'), s('  3.4 GHz', 'gray')],
      [],
      ...cores
        .slice(0, 4)
        .flatMap((value, i): Line[] => [
          [
            s(` C${i} `, 'gray'),
            ...meter(value, 10),
            s(` ${padStart(String(Math.round(value * 100)), 3)}%  `),
            s(`C${i + 4} `, 'gray'),
            ...meter(cores[i + 4], 10),
            s(` ${padStart(String(Math.round(cores[i + 4] * 100)), 3)}%`),
          ],
        ]),
      [s(` load avg `, 'gray'), s('2.41 1.98 1.77', 'fg'), fill, s(`${nf.faBatteryThreeQuarters} 78% `, 'green')],
    ],
    'cyan',
  );
  const mem = box(
    `${nf.mdMemory} mem`,
    30,
    [
      [s(' Total:', 'gray'), fill, s('36.0 GiB ')],
      [s(' Used: ', 'gray'), fill, s('21.4 GiB ', 'yellow')],
      [s(' '), ...meter(0.59, 26)],
      [s(' Free: ', 'gray'), fill, s('14.6 GiB ', 'green')],
      [s(' '), ...meter(0.41, 26)],
      [],
      [s(` ${nf.mdHarddisk} disk`, 'white'), fill, s('412/994 GiB ')],
      [s(' '), ...meter(0.41, 26)],
      [s(` ${nf.mdWifi} en0 `, 'white'), s(`${nf.faArrowDown} 4.2M `, 'green'), s(`${nf.faArrowUp} 310K`, 'red')],
    ],
    'magenta',
  );
  const procs: [string, string, string, number, string][] = [
    ['4211', 'node', 'pnpm dev --host', 0.34, '412M'],
    ['1093', 'Code Helper', '--type=renderer', 0.21, '1.2G'],
    ['8820', 'nvim', 'src/server.ts', 0.06, '88M'],
    ['377', 'WindowServer', '-daemon', 0.05, '640M'],
    ['5120', 'postgres', '-D /usr/local/var/pg', 0.03, '210M'],
    ['9911', 'zsh', '-l', 0.01, '12M'],
  ];
  const proc = box(
    `${nf.octPackage} proc`,
    83,
    [
      [s(' Pid   Program        Command                Cpu%               MemB', 'gray', {bold: true})],
      ...procs.map(([pid, name, cmd, share, memory]): Line => [
        s(` ${pid.padEnd(6)}`, 'gray'),
        s(name.padEnd(15), 'fg', {bold: name === 'node'}),
        s(cmd.padEnd(23), 'gray'),
        s(padStart(String(Math.round(share * 100)), 3), 'fg'),
        s('  '),
        ...meter(share * 2.5, 14),
        fill,
        s(`${memory} `, 'fg'),
      ]),
    ],
    'blue',
  );
  return [
    [
      s(` ${nf.faClockO} 09:14:30`, 'white', {bold: true}),
      fill,
      s('btop', 'gray'),
      s(' · ', 'gray'),
      s('up 3d 4h ', 'gray'),
    ],
    ...sideBySide([cpu, mem]),
    ...proc,
  ];
}

function glyphs(): Line[] {
  const heading = (text: string): Line => [s(text, 'blue', {bold: true})];
  const lines: Line[] = [
    heading('Legibility'),
    [s('  o0O  1lI|  il1L  rnm  cl  5S  2Z  8B  ({[<>]})  ;:,.  `\'"  ~-_  *#@&%$')],
    [s('  The quick brown fox jumps over the lazy dog. 0123456789')],
    [s('  THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG!?', 'white')],
    [s('  italic for comments and keywords', 'gray', {italic: true}), s('  bold for headings', 'fg', {bold: true})],
    [],
    heading('Ligatures'),
    [s('  => -> <- <= >= != !== === == :: |> <| /* */ // && || ?? ++ -- </ /> <=> ... www', 'cyan')],
    [],
    heading('Box drawing and blocks'),
    [s('  ┌──┬──┐ ╭──┬──╮ ╔══╦══╗  ░░▒▒▓▓██  ▁▂▃▄▅▆▇█  ⣿⣷⣯⣟⡿⢿⣻⣽  ■□▪▫●○◆◇', 'white')],
    [
      s('  ├──┼──┤ │  │  │ ╠══╬══╣  ', 'white'),
      s('▐▌▐▌▐▌', 'green'),
      s('  ', 'white'),
      s('▔▔▔▔▔▔▔▔', 'yellow'),
      s('  ✓ ✗ ★ ☆ ♥ ⚡ ⚙ ⏻', 'white'),
    ],
    [s('  └──┴──┘ ╰──┴──╯ ╚══╩══╝  ', 'white'), s('│▕▏╱╲╳', 'white')],
    [],
    heading('Powerline'),
    [
      s('  '),
      ...powerline([
        {t: 'one', bg: 'red'},
        {t: 'two', bg: 'yellow'},
        {t: 'three', bg: 'green'},
      ]),
      s('  '),
      s(nf.pleLeftHalfCircleThick, 'magenta'),
      s(`${nf.faHome} rounded`, 'black', {bg: 'magenta'}),
      s(nf.pleRightHalfCircleThick, 'magenta'),
      s('  '),
      ...rightPowerline([
        {t: 'right', bg: 'blue'},
        {t: 'side', bg: 'cyan'},
      ]),
    ],
    [],
    heading('Icons'),
  ];
  for (const set of glyphSets) {
    lines.push([s(`  ${set.name.padEnd(16)}`, 'gray'), s(set.glyphs.map(glyph => glyph.char).join(' '), 'fg')]);
  }
  return lines;
}

function custom(text: string): Line[] {
  return [
    ...prompt('~', {branch: 'main'}),
    [s('❯ ', 'green', {bold: true}), s('cat', 'green'), s(' sample.txt', 'cyan')],
    ...text.split('\n').map(line => [s(line)]),
    [],
    [s('❯ ', 'green', {bold: true}), cursor],
  ];
}
