import {type Color} from './themes';

// A terminal screen is a list of lines, and a line is a list of styled runs of text.
export type Seg = {
  t: string;
  fg?: Color;
  bg?: Color;
  bold?: boolean;
  italic?: boolean;
  dim?: boolean;
  underline?: boolean;
  // Pushes the rest of the line to the right edge, like a right-side prompt.
  fill?: boolean;
  cursor?: boolean;
};

export type Line = Seg[];

type Style = Omit<Seg, 't'>;

export function s(t: string, fg?: Color, style: Style = {}): Seg {
  return {t, fg, ...style};
}

export const fill: Seg = {t: '', fill: true};

export const cursor: Seg = {t: ' ', cursor: true};

// Width in terminal cells. Terminals give every code point (icons included) one cell, so this counts code
// points rather than graphemes.
export function cells(text: string) {
  // oxlint-disable-next-line typescript/no-misused-spread
  return [...text].length;
}

export function width(line: Line) {
  return line.reduce((sum, seg) => sum + cells(seg.t), 0);
}

// Pads a line to a fixed width. A fill segment in the line takes up the extra space, so the text after it
// lines up with the right edge.
export function pad(line: Line, size: number, style: Style = {}): Line {
  const missing = Math.max(0, size - width(line));
  const at = line.findIndex(seg => seg.fill);
  if (at !== -1) {
    return [...line.slice(0, at), {...line[at], t: ' '.repeat(missing), fill: false}, ...line.slice(at + 1)];
  }
  return missing > 0 ? [...line, {t: ' '.repeat(missing), ...style}] : line;
}

export function padStart(text: string, size: number) {
  return ' '.repeat(Math.max(0, size - cells(text))) + text;
}

// A box with rounded corners and a title in the top border, btop style.
export function box(
  title: string,
  size: number,
  body: Line[],
  color: Color = 'gray',
  titleColor: Color = 'fg',
): Line[] {
  const inner = size - 2;
  const top: Line = [
    s('╭─', color),
    s(title, titleColor, {bold: true}),
    s(`${'─'.repeat(Math.max(0, inner - 1 - cells(title)))}╮`, color),
  ];
  const rows = body.map(line => [s('│', color), ...pad(line, inner), s('│', color)]);
  return [top, ...rows, [s(`╰${'─'.repeat(inner)}╯`, color)]];
}

// Places blocks of lines next to each other, padding each block to its own width.
export function sideBySide(blocks: Line[][], gap = 1): Line[] {
  const height = Math.max(...blocks.map(block => block.length));
  const widths = blocks.map(block => Math.max(...block.map(width)));
  return Array.from({length: height}, (_, row) =>
    blocks.flatMap((block, i) => {
      const line = pad(block[row] ?? [], widths[i]);
      return i < blocks.length - 1 ? [...line, s(' '.repeat(gap))] : line;
    }),
  );
}
