import { track } from '../../src/track.js';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  },
});

export async function onRequestGet({ request, env }) {
  if (!env.STRIPE_SECRET_KEY || !env.AUDIO_BUCKET) {
    return json({ error: 'Download delivery is not configured yet.' }, 503);
  }

  const sessionId = new URL(request.url).searchParams.get('session_id');
  if (!sessionId || !/^cs_(test|live)_[A-Za-z0-9_]+$/.test(sessionId)) {
    return json({ error: 'A valid Stripe checkout session is required.' }, 400);
  }

  let stripeResponse;
  try {
    stripeResponse = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } },
    );
  } catch (error) {
    console.error('Stripe payment verification failed:', error);
    return json({ error: 'Payment verification is temporarily unavailable.' }, 502);
  }

  let session;
  try {
    session = await stripeResponse.json();
  } catch (error) {
    console.error('Stripe returned an invalid session response:', error);
    return json({ error: 'Payment verification is temporarily unavailable.' }, 502);
  }

  if (stripeResponse.status === 404) {
    return json({ error: 'This checkout session could not be found.' }, 403);
  }
  if (!stripeResponse.ok) {
    console.error('Stripe could not verify the checkout session:', stripeResponse.status);
    return json({ error: 'Payment verification is temporarily unavailable.' }, 502);
  }

  const isPaidTrackSession = session.mode === 'payment'
    && session.payment_status === 'paid'
    && session.currency === track.currency
    && session.amount_total === track.unitAmount
    && session.metadata?.product_id === track.id;
  if (!isPaidTrackSession) {
    return json({ error: 'A completed payment for this track is required.' }, 403);
  }

  const audio = await env.AUDIO_BUCKET.get(track.downloadKey);
  if (!audio) {
    console.error(`The private audio object is missing: ${track.downloadKey}`);
    return json({ error: 'The purchased audio is temporarily unavailable.' }, 503);
  }

  const headers = new Headers({
    'Content-Type': 'audio/mpeg',
    'Content-Disposition': 'attachment; filename="Field-Pulling-Mustard-Jae-Stae.mp3"',
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  });
  if (audio.size !== undefined) headers.set('Content-Length', String(audio.size));

  return new Response(audio.body, { headers });
}
