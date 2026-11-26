import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from './create-checkout-session.js';
import { onRequestGet } from './download.js';

test('checkout creates a fixed-price Stripe session for the track', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  let requestBody;
  globalThis.fetch = async (url, options) => {
    calls.push(String(url));
    if (calls.length === 1) {
      return Response.json({
        active: true,
        currency: 'usd',
        unit_amount: 199,
        product: { name: 'Field Pulling Mustard' },
      });
    }
    requestBody = new URLSearchParams(options.body);
    return Response.json({ url: 'https://checkout.stripe.com/c/pay/test' });
  };

  try {
    const response = await onRequestPost({
      request: new Request('https://records.example/api/create-checkout-session', { method: 'POST' }),
      env: { STRIPE_SECRET_KEY: 'sk_test_example', STRIPE_PRICE_ID: 'price_123', AUDIO_BUCKET: { async head() { return {}; } } },
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { url: 'https://checkout.stripe.com/c/pay/test' });
    assert.match(calls[0], /\/v1\/prices\/price_123\?expand\[\]=product$/);
    assert.equal(requestBody.get('line_items[0][price]'), 'price_123');
    assert.equal(requestBody.get('metadata[product_id]'), 'field-pulling-mustard');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('checkout rejects a Stripe price that does not match the displayed price', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({
    active: true,
    currency: 'usd',
    unit_amount: 499,
    product: { name: 'Field Pulling Mustard' },
  });

  try {
    const response = await onRequestPost({
      request: new Request('https://records.example/api/create-checkout-session', { method: 'POST' }),
      env: { STRIPE_SECRET_KEY: 'sk_test_example', STRIPE_PRICE_ID: 'price_123', AUDIO_BUCKET: { async head() { return {}; } } },
    });
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /active \$1\.99 USD/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('checkout cannot charge for a missing audio object', async () => {
  const originalFetch = globalThis.fetch;
  let stripeCalled = false;
  globalThis.fetch = async () => { stripeCalled = true; throw new Error('Stripe should not be called'); };
  try {
    const response = await onRequestPost({
      request: new Request('https://records.example/api/create-checkout-session', { method: 'POST' }),
      env: { STRIPE_SECRET_KEY: 'sk_test_example', STRIPE_PRICE_ID: 'price_123', AUDIO_BUCKET: { async head() { return null; } } },
    });
    assert.equal(response.status, 503);
    assert.equal(stripeCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('download only serves the private MP3 after Stripe confirms payment', async () => {
  const originalFetch = globalThis.fetch;
  let bucketReads = 0;
  globalThis.fetch = async () => Response.json({
    mode: 'payment',
    payment_status: 'paid',
    currency: 'usd',
    amount_total: 199,
    metadata: { product_id: 'field-pulling-mustard' },
  });

  try {
    const response = await onRequestGet({
      request: new Request('https://records.example/api/download?session_id=cs_test_abc123'),
      env: {
        STRIPE_SECRET_KEY: 'sk_test_example',
        AUDIO_BUCKET: {
          async get(key) {
            bucketReads += 1;
            assert.equal(key, 'field-pulling-mustard.mp3');
            return { body: new Blob(['private audio']).stream(), size: 12 };
          },
        },
      },
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), 'audio/mpeg');
    assert.match(response.headers.get('Content-Disposition'), /attachment/);
    assert.equal(await response.text(), 'private audio');
    assert.equal(bucketReads, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('download does not read the private MP3 for unpaid sessions', async () => {
  const originalFetch = globalThis.fetch;
  let bucketReads = 0;
  globalThis.fetch = async () => Response.json({
    mode: 'payment',
    payment_status: 'unpaid',
    currency: 'usd',
    amount_total: 199,
    metadata: { product_id: 'field-pulling-mustard' },
  });

  try {
    const response = await onRequestGet({
      request: new Request('https://records.example/api/download?session_id=cs_test_abc123'),
      env: {
        STRIPE_SECRET_KEY: 'sk_test_example',
        AUDIO_BUCKET: { async get() { bucketReads += 1; return null; } },
      },
    });
    assert.equal(response.status, 403);
    assert.equal(bucketReads, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
