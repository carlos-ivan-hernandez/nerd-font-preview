# Nerd Font Preview

A dark-mode web app for previewing every monospace [Nerd Font](https://www.nerdfonts.com) in a realistic terminal: a zsh session with a powerline prompt, `eza` icons and test output, Neovim with a file tree and statusline, a btop-style system monitor, a glyph test sheet, and your own text.

## Usage

```sh
pnpm install
pnpm dev
```

- Pick a font in the sidebar, or press <kbd>↑</kbd>/<kbd>↓</kbd> (or <kbd>j</kbd>/<kbd>k</kbd>) to step through them. <kbd>/</kbd> focuses the search.
- <kbd>1</kbd>–<kbd>5</kbd> switch between the terminal tabs (zsh, nvim, btop, glyphs, custom).
- **Nerd Font / Mono** (<kbd>m</kbd>) switches between the two variants. In **Nerd Font**, icons can be wider than a cell. In **Mono**, every icon is squeezed into one cell.
- Theme, font size, line height and ligatures can all be changed, and every setting is remembered.
- A font is downloaded the first time you pick it (1–7 MB, so there's a short wait), and kept in the browser from then on. Downloaded fonts have a filled dot in the sidebar. **Download all** at the top of the sidebar downloads every font that's left. 17 families (Geist Mono, Commit Mono, Monaspace, Zed Mono and others) come from release archives the dev server has to fetch first. Until then they show a **↓** button with the archive's size.
- **Copy name** copies the family name to type into your terminal's settings. **Download file** gets the single Regular font file, and **Download …zip** gets the whole family from the Nerd Fonts release.

Only the Regular weight is loaded, so bold and italic text is synthesized by the browser. Most terminals do the same when only Regular is installed.

## How it works

`src/fonts.json` lists every font. `scripts/fonts.mjs` builds it from the Nerd Fonts release pinned in `TAG`: it finds each family's `*NerdFont-Regular` file (and its `*NerdFontMono-Regular` twin) in the repo tree, and those files are loaded from jsDelivr. Some families aren't in the repo, only in release archives, so the script reads those archives to list their fonts (caching them in `node_modules/.cache`). Proportional fonts (Arimo, Noto Sans, Ubuntu and so on) and the symbols-only font are skipped. Run it with `pnpm fonts` after changing `TAG`.

GitHub release downloads don't allow cross-origin requests, so the browser can't download those archives itself. `scripts/downloads.ts` is a Vite plugin that does it in the dev and preview servers: `GET /api/downloads` says which families are downloaded, `POST /api/downloads/:family` downloads one archive and unpacks its Regular files into `public/fonts` (gitignored), and `/fonts/:file` serves them. A static build served without the plugin expects those files to be there already.

Font files are kept in Cache Storage (`src/lib/cache.ts`), which is how the app knows which fonts are downloaded. Cache Storage only works on https or localhost, so opened from another address, fonts are fetched every time. Fonts are registered with the `FontFace` API under their own family names (`src/lib/fonts.ts`). The previous font stays on screen until the next one has loaded, and the fonts above and below the selection are loaded in the background so stepping through the list is instant.

Each terminal screen in `src/lib/scenes.ts` is plain data: a list of lines, each a list of styled text runs (`src/lib/term.ts`). Colors are theme names (`red`, `surface`, …) that the terminal maps to the selected theme's CSS variables (`src/lib/themes.ts`). Icon codepoints in `src/lib/glyphs.ts` come from the repo's `glyphnames.json`.

## Scripts

- `pnpm dev`: dev server
- `pnpm build`: typecheck and production build to `dist/`
- `pnpm fonts`: rebuild `src/fonts.json` from the release (after changing `TAG`)
- `pnpm lint` / `pnpm fmt`: oxlint / oxfmt
