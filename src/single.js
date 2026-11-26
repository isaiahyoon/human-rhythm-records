import './styles.css';
import { track } from './track.js';

const viewButtons = document.querySelectorAll('[data-view]');
const deckParts = document.querySelectorAll('[data-deck-part]');
const previewButton = document.querySelector('#preview-track');
const previewAudio = document.querySelector('#track-preview');
const buyButton = document.querySelector('#buy-track');
const downloadButton = document.querySelector('#download-track');
const status = document.querySelector('#single-status');

function setStatus(message) {
  status.textContent = message;
}

previewButton.addEventListener('click', async () => {
  if (!previewAudio.paused) {
    previewAudio.pause();
    return;
  }

  try {
    await previewAudio.play();
  } catch (error) {
    console.error('Could not play the track preview:', error);
    setStatus('The preview could not be played. Please try again.');
  }
});

previewAudio.addEventListener('play', () => {
  previewButton.textContent = 'Pause preview';
});
previewAudio.addEventListener('pause', () => {
  previewButton.textContent = 'Play 30-second preview';
});
previewAudio.addEventListener('ended', () => {
  previewButton.textContent = 'Play 30-second preview';
});
previewAudio.addEventListener('error', () => {
  setStatus('The preview is temporarily unavailable.');
});

buyButton.addEventListener('click', async () => {
  buyButton.disabled = true;
  setStatus('Opening secure Stripe checkout…');

  try {
    const response = await fetch('/api/create-checkout-session', { method: 'POST' });
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('Secure checkout is unavailable in this environment.');
    }
    const result = await response.json();
    if (!response.ok || typeof result.url !== 'string') {
      throw new Error(result.error || 'Checkout could not be started.');
    }
    window.location.assign(result.url);
  } catch (error) {
    console.error('Could not start Stripe checkout:', error);
    setStatus(error.message || 'Checkout is temporarily unavailable. Please try again.');
    buyButton.disabled = false;
  }
});

downloadButton.addEventListener('click', async () => {
  const sessionId = new URLSearchParams(window.location.search).get('session_id');
  if (!sessionId) {
    setStatus('This download link is missing its checkout session. Please use the link from your purchase confirmation.');
    return;
  }

  downloadButton.disabled = true;
  setStatus('Verifying your payment and preparing the MP3…');
  try {
    const response = await fetch(`/api/download?session_id=${encodeURIComponent(sessionId)}`);
    if (!response.ok) {
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Your download could not be verified.');
      }
      const result = await response.json();
      throw new Error(result.error || 'Your download could not be verified.');
    }
    if (response.headers.get('content-type') !== 'audio/mpeg') {
      throw new Error('The server did not return the purchased MP3.');
    }

    const file = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = file;
    link.download = `${track.title} - ${track.artist}.mp3`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(file), 1000);
    setStatus('Your download has started. Save this page’s address if you want to download it again.');
  } catch (error) {
    console.error('Could not download the purchased track:', error);
    setStatus(error.message || 'The download is temporarily unavailable. Please try again.');
  } finally {
    downloadButton.disabled = false;
  }
});

const purchase = new URLSearchParams(window.location.search).get('purchase');
if (purchase === 'success') {
  buyButton.hidden = true;
  downloadButton.hidden = false;
  setStatus('Your payment will be verified with Stripe before the MP3 is delivered. Save this page’s address to download again later.');
} else if (purchase === 'cancelled') {
  setStatus('Checkout was cancelled; no payment was taken.');
}

viewButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const view = button.dataset.view;
    viewButtons.forEach((control) => {
      const active = control === button;
      control.classList.toggle('active', active);
      control.setAttribute('aria-pressed', String(active));
    });
    deckParts.forEach((part) => {
      part.toggleAttribute('hidden', part.dataset.deckPart !== view);
    });
  });
});
