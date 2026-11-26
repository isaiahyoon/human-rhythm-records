import { track } from '../../src/track.js';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  },
});

export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRICE_ID || !env.AUDIO_BUCKET) {
    return json({ error: 'Stripe checkout is not configured yet.' }, 503);
  }

  let audio;
  try {
    audio = await env.AUDIO_BUCKET.head(track.downloadKey);
  } catch (error) {
    console.error('Could not check the private audio object:', error);
    return json({ error: 'The track is temporarily unavailable for purchase.' }, 503);
  }
  if (!audio) {
    console.error(`The private audio object is missing: ${track.downloadKey}`);
    return json({ error: 'The track is temporarily unavailable for purchase.' }, 503);
  }

  let priceResponse;
  try {
    priceResponse = await fetch(
      `https://api.stripe.com/v1/prices/${encodeURIComponent(env.STRIPE_PRICE_ID)}?expand[]=product`,
      { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } },
    );
  } catch (error) {
    console.error('Stripe price verification failed:', error);
    return json({ error: 'Stripe checkout is temporarily unavailable.' }, 502);
  }

  let price;
  try {
    price = await priceResponse.json();
  } catch (error) {
    console.error('Stripe returned an invalid price response:', error);
    return json({ error: 'Stripe checkout is temporarily unavailable.' }, 502);
  }

  const isExpectedPrice = price.active === true
    && price.currency === track.currency
    && price.unit_amount === track.unitAmount
    && !price.recurring
    && price.product?.name === track.title;
  if (!priceResponse.ok || !isExpectedPrice) {
    console.error('Stripe price is missing or does not match the track:', priceResponse.status);
    return json({ error: 'The Stripe price must be an active $1.99 USD one-time price for this track.' }, 503);
  }

  const origin = new URL(request.url).origin;
  const form = new URLSearchParams({
    mode: 'payment',
    'managed_payments[enabled]': 'false',
    success_url: `${origin}/?purchase=success&session_id={CHECKOUT_SESSION_ID}#listening-room`,
    cancel_url: `${origin}/?purchase=cancelled#listening-room`,
    'line_items[0][quantity]': '1',
    'line_items[0][price]': env.STRIPE_PRICE_ID,
    'metadata[product_id]': track.id,
  });

  let stripeResponse;
  try {
    stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    });
  } catch (error) {
    console.error('Stripe checkout request failed:', error);
    return json({ error: 'Stripe checkout is temporarily unavailable.' }, 502);
  }

  let session;
  try {
    session = await stripeResponse.json();
  } catch (error) {
    console.error('Stripe returned an invalid checkout response:', error);
    return json({ error: 'Stripe checkout is temporarily unavailable.' }, 502);
  }

  if (!stripeResponse.ok || typeof session.url !== 'string'
    || !session.url.startsWith('https://checkout.stripe.com/')) {
    console.error('Stripe could not create a checkout session:', stripeResponse.status);
    return json({ error: 'Stripe checkout is temporarily unavailable.' }, 502);
  }

  return json({ url: session.url });
}
