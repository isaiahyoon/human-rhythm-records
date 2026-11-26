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

## Listening room and Stripe checkout

The listening room features “Field Pulling Mustard” by Jae Stae. A 30-second preview is public; the full 320 kbps MP3 is served from a private Cloudflare R2 bucket only after the Stripe Checkout session is verified as paid. The checkout price is USD $1.99.

To enable live checkout and downloads:

1. Upload the original MP3 to the private R2 bucket `human-rhythm-records-audio` as `field-pulling-mustard.mp3`:

   ```sh
   npx wrangler r2 object put human-rhythm-records-audio/field-pulling-mustard.mp3 --file "/path/to/Field Pulling Mustard - Jae Stae.mp3" --remote
   ```

2. The Cloudflare Worker configuration contains the live Stripe Price ID for the active $1.99 USD one-time product. The configuration preserves other dashboard variables across deployments.
3. The root `wrangler.toml` binds the bucket as `AUDIO_BUCKET` for the Worker.
4. Add `STRIPE_SECRET_KEY` as a secret in the Cloudflare Worker settings (or with `npx wrangler secret put STRIPE_SECRET_KEY`). Do not put the key in source control or client-side code.
5. Deploy the Worker and assets. The local Vite server does not run the Worker, so checkout and download endpoints require the Worker runtime.

After payment, the buyer returns to a page with the download button. This implementation does not send download links by email; buyers must retain the return-page URL to download again.

The preview file is generated from the supplied MP3 at `public/audio/field-pulling-mustard-preview.mp3`; the full original audio is intentionally not stored in the public build. The supplied HRR artwork remains in `public/images/hrr/`.

## Saved vinyl storefront

The previous fictional vinyl-shop demo is preserved in `archive/vinyl-storefront.html`, with its existing `src/main.js`, `src/catalog.js`, and `src/shop.js`. It is not included in the production site. To restore it for future development, replace the root `index.html` with the archived HTML; it uses the same stylesheet and public assets. Its checkout and newsletter are demos, not live services.
