import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.js';

test('Worker routes checkout and download to their handlers', async () => {
  const checkout = await worker.fetch(new Request('https://records.example/api/create-checkout-session', { method: 'POST' }), {});
  const download = await worker.fetch(new Request('https://records.example/api/download'), {});
  assert.equal(checkout.status, 503);
  assert.equal(download.status, 503);
  assert.match((await checkout.json()).error, /not configured/);
  assert.match((await download.json()).error, /not configured/);
});

test('Worker handles invalid API routes and delegates static assets', async () => {
  const env = { ASSETS: { fetch: async () => new Response('asset') } };
  assert.equal((await worker.fetch(new Request('https://records.example/api/download', { method: 'POST' }), env)).status, 405);
  assert.equal((await worker.fetch(new Request('https://records.example/api/missing'), env)).status, 404);
  assert.equal(await (await worker.fetch(new Request('https://records.example/'), env)).text(), 'asset');
});
