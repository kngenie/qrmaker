# QR Maker

A small, friendly web app that turns a web address into a QR code image.

- **Runs entirely in the browser.** The page is static files; codes are drawn locally and
  downloaded straight from memory. Nothing is uploaded or stored on a server, so it can't
  be used as an image host.
- Ready-made looks (classic, rounded, dots, leafy…), code / background colors, optional
  center logo, three output sizes, and PNG / SVG / JPEG download or copy-to-clipboard.
- Plain-language options for non-technical users: error correction is “How sturdy should
  it be?”, the quiet zone is “Blank space around the code”, and color choices that phones
  may struggle to read trigger a warning.
- Settings (address, style, colors, and small logos) can be saved in the browser's
  `localStorage` and reused later.

Built with [Lit](https://lit.dev) web components and
[qr-code-styling](https://github.com/kozakdenys/qr-code-styling), bundled by Vite.

## Develop

```sh
npm install
npm run dev       # http://localhost:5173
npm run build     # outputs static files to dist/
npm run preview   # serve dist/ locally
```

## Layout

| Path | Purpose |
| --- | --- |
| `src/components/qr-app.js` | Page layout and app state |
| `src/components/qr-preview.js` | Live preview, download and copy |
| `src/components/look-picker.js` | Style thumbnails |
| `src/components/color-picker.js` | Color swatches |
| `src/components/saved-list.js` | Saved settings list |
| `src/lib/qr-options.js` | Choices, defaults, URL handling, settings → library options |
| `src/lib/storage.js` | `localStorage` persistence |
| `src/theme.css` | Color tokens (light and dark) |
| `public/_headers` | Security headers (CSP etc.) for Netlify / Cloudflare |

## Notes

- URLs are encoded in their ASCII form (`URL.href`: punycode host, percent-encoded path).
  qr-code-styling keeps only the low byte of each character, so non-ASCII text would
  otherwise be corrupted; `toQrOptions` also converts data to UTF-8 bytes as a safeguard.
- Adding a logo automatically raises error correction to the highest level, since the logo
  covers part of the code.

## Deploy

Both hosts read `public/_headers` (copied into `dist/`), which sets a strict
Content-Security-Policy.

**Netlify:** connect the repo; `netlify.toml` sets `npm run build` and publishes `dist`.

**Cloudflare Pages:** build command `npm run build`, output directory `dist`.

**Cloudflare Workers (static assets):** `npm run build && npx wrangler deploy` (see `wrangler.toml`).
