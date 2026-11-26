# Human Rhythm Records

A responsive Human Rhythm Records site inspired by the supplied artwork: bold musician silhouettes, vivid color blocking, analog print texture, and the tactile ritual of playing a record. Quiet themes of release, refuge, and returning to yourself shape the copy without becoming overt.

## Run

```sh
npm install
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

Vite prints the local URL. This is a vanilla JavaScript app. Google Fonts are optional; system fallbacks work offline.

## Current site

The listening room presents a single upcoming track with placeholder title, artist, and artwork. The platter and sleeve views are interactive, but playback and downloading are disabled until audio and checkout are set up. No payment processing or download delivery is implemented yet.

The supplied HRR artwork is stored in `public/images/hrr/`. No account or API keys are needed to run the site locally.

## Saved vinyl storefront

The previous fictional vinyl-shop demo is preserved in `archive/vinyl-storefront.html`, with its existing `src/main.js`, `src/catalog.js`, and `src/shop.js`. It is not included in the production site. To restore it for future development, replace the root `index.html` with the archived HTML; it uses the same stylesheet and public assets. Its checkout and newsletter are demos, not live services.
