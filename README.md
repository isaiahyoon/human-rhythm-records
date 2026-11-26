# Human Rhythm Records

A responsive vinyl storefront demo for Human Rhythm Records. Its visual language draws on the supplied HRR artwork: bold musician silhouettes, vivid color blocking, analog print texture, and the tactile ritual of playing a record. Quiet themes of release, refuge, and returning to yourself shape the copy without becoming overt.

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

## Demo scope

- Eight fictional records with genre filtering, search, sorting, details, tracklists, pressing information, and stock limits.
- Interactive listening-room discovery: select a record, switch between platter and sleeve views, inspect both sides' tracklists, and open or add the selected pressing. This is a visual preview, not an audio player.
- Persistent shopping bag, quantity controls, and free standard shipping at $75.
- Full checkout with validated U.S. shipping details, delivery selection, order review, explicit demo consent, confirmation, and downloadable receipt.
- Standard shipping is $6; express is $14. Illustrative tax is 8.25% of merchandise, rounded to the nearest cent, not a real tax calculation.
- No payment collection, backend, fulfillment, email sending, or real newsletter subscription.
- Bag and the latest demo receipt are stored in browser local storage. The receipt contains no customer details. Shipping details stay in memory and clear on order completion or reload.
- The newsletter is an explicitly labeled interaction demo and does not store addresses.

All artists, titles, inventory, and product descriptions are fictional. Supplied HRR artwork is stored in `public/images/hrr/`; the catalog's generated covers are original vector artwork. No account or API keys are needed. Clear this site's browser storage to reset saved demo data.
