export type Palette = {
  bg: string;
  fg: string;
  // Panels and inactive tabs, a little lighter than bg.
  surface: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  orange: string;
  // Bright black: comments, dim text, borders.
  gray: string;
};

export type Color = keyof Palette;

export type Theme = {id: string; name: string; colors: Palette};

export const themes: Theme[] = [
  {
    id: 'graphite',
    name: 'Graphite',
    colors: {
      bg: '#161616',
      fg: '#d6d6d6',
      surface: '#262626',
      black: '#0c0c0c',
      red: '#f2777a',
      green: '#a5d6a7',
      yellow: '#f6c977',
      blue: '#7fb2f0',
      magenta: '#d4a6e0',
      cyan: '#79d0cf',
      white: '#ededed',
      orange: '#f5a46b',
      gray: '#6e6e6e',
    },
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    colors: {
      bg: '#1a1b26',
      fg: '#c0caf5',
      surface: '#24283b',
      black: '#15161e',
      red: '#f7768e',
      green: '#9ece6a',
      yellow: '#e0af68',
      blue: '#7aa2f7',
      magenta: '#bb9af7',
      cyan: '#7dcfff',
      white: '#a9b1d6',
      orange: '#ff9e64',
      gray: '#565f89',
    },
  },
  {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    colors: {
      bg: '#1e1e2e',
      fg: '#cdd6f4',
      surface: '#313244',
      black: '#11111b',
      red: '#f38ba8',
      green: '#a6e3a1',
      yellow: '#f9e2af',
      blue: '#89b4fa',
      magenta: '#cba6f7',
      cyan: '#94e2d5',
      white: '#bac2de',
      orange: '#fab387',
      gray: '#6c7086',
    },
  },
  {
    id: 'dracula',
    name: 'Dracula',
    colors: {
      bg: '#282a36',
      fg: '#f8f8f2',
      surface: '#343746',
      black: '#21222c',
      red: '#ff5555',
      green: '#50fa7b',
      yellow: '#f1fa8c',
      blue: '#bd93f9',
      magenta: '#ff79c6',
      cyan: '#8be9fd',
      white: '#e6e6e6',
      orange: '#ffb86c',
      gray: '#6272a4',
    },
  },
  {
    id: 'gruvbox-dark',
    name: 'Gruvbox Dark',
    colors: {
      bg: '#282828',
      fg: '#ebdbb2',
      surface: '#3c3836',
      black: '#1d2021',
      red: '#fb4934',
      green: '#b8bb26',
      yellow: '#fabd2f',
      blue: '#83a598',
      magenta: '#d3869b',
      cyan: '#8ec07c',
      white: '#d5c4a1',
      orange: '#fe8019',
      gray: '#928374',
    },
  },
  {
    id: 'nord',
    name: 'Nord',
    colors: {
      bg: '#2e3440',
      fg: '#d8dee9',
      surface: '#3b4252',
      black: '#242933',
      red: '#bf616a',
      green: '#a3be8c',
      yellow: '#ebcb8b',
      blue: '#81a1c1',
      magenta: '#b48ead',
      cyan: '#88c0d0',
      white: '#e5e9f0',
      orange: '#d08770',
      gray: '#616e88',
    },
  },
  {
    id: 'one-dark',
    name: 'One Dark',
    colors: {
      bg: '#282c34',
      fg: '#abb2bf',
      surface: '#353b45',
      black: '#1e2127',
      red: '#e06c75',
      green: '#98c379',
      yellow: '#e5c07b',
      blue: '#61afef',
      magenta: '#c678dd',
      cyan: '#56b6c2',
      white: '#dcdfe4',
      orange: '#d19a66',
      gray: '#5c6370',
    },
  },
];
