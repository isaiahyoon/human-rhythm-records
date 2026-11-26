import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { products, coverUrl } from './catalog.js';
import { money, findProduct, totals, validateCart, filterProducts } from './shop.js';

const html = readFileSync(new URL('../archive/vinyl-storefront.html', import.meta.url), 'utf8');
const singleHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('./main.js', import.meta.url), 'utf8');
const single = readFileSync(new URL('./single.js', import.meta.url), 'utf8');

function renderApp() {
  const elements = new Map();
  const element = () => ({
    dataset: {},
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {},
    toggleAttribute() {},
    querySelector() { return element(); },
    querySelectorAll() { return []; },
    addEventListener() {},
    append() {},
    focus() {},
    showModal() { this.open = true; },
  });
  const icons = [...html.matchAll(/<span\b[^>]*data-icon="([^"]+)"[^>]*>/g)]
    .map((match) => ({ ...element(), dataset: { icon: match[1] } }));
  const document = {
    body: element(),
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, element());
      return elements.get(selector);
    },
    querySelectorAll(selector) { return selector === '[data-icon]' ? icons : []; },
    addEventListener() {},
  };
  const context = createContext({
    document, products, coverUrl, money, findProduct, totals, validateCart, filterProducts,
    localStorage: { getItem() { return null; } },
    console, setTimeout, clearTimeout,
  });
  runInContext(main.replace(/^import .*;\n/gm, ''), context);
  return { context, elements, icons };
}

test('static decorative stars and arrows render as hidden SVGs', () => {
  const { icons } = renderApp();
  for (const name of ['spark', 'arrow-right', 'arrow-up-right']) {
    const matching = icons.filter((icon) => icon.dataset.icon === name);
    assert.ok(matching.length > 0, `missing ${name} placeholders`);
    for (const icon of matching) {
      assert.match(icon.innerHTML, /^<svg\b[^>]*aria-hidden="true">/);
      assert.match(icon.innerHTML, /stroke="currentColor"/);
    }
  }
  assert.doesNotMatch(html, /[✳↗→]/);
  assert.doesNotMatch(main, /[✳↗→]/);
});

test('storefront identity and supplied artwork belong to Human Rhythm Records', () => {
  assert.match(singleHtml, /<title>Human Rhythm Records/);
  assert.match(singleHtml, /aria-label="Human Rhythm Records home"/);
  assert.match(singleHtml, /\/images\/hrr\/hrr-logo\.png/);
  assert.match(singleHtml, /\/images\/hrr\/acid-jazz-sessions\.png/);
  assert.doesNotMatch(singleHtml, /Jasa|jasas-records/i);
  assert.doesNotMatch(singleHtml, /Psalm 32/i);
});

test('single-track placeholder does not offer unavailable audio or checkout', () => {
  assert.match(singleHtml, /<button[^>]*disabled>Play preview<\/button>/);
  assert.match(singleHtml, /<button[^>]*disabled>Download coming soon<\/button>/);
  assert.match(singleHtml, /Audio and checkout are not available yet/);
  assert.doesNotMatch(singleHtml, /The Long Way Home|shopping bag|free U\.S\. shipping/i);
});

test('platter and sleeve views remain mutually exclusive', () => {
  const buttons = ['platter', 'sleeve'].map((view) => ({
    dataset: { view },
    classList: { toggle(_name, active) { this.active = active; } },
    setAttribute(_name, value) { this.pressed = value; },
    addEventListener(_name, listener) { this.click = listener; },
  }));
  const parts = ['platter', 'platter', 'sleeve'].map((view) => ({
    dataset: { deckPart: view },
    toggleAttribute(_name, hidden) { this.hidden = hidden; },
  }));
  const document = {
    querySelectorAll(selector) { return selector === '[data-view]' ? buttons : parts; },
  };
  runInContext(single.replace(/^import .*;\n/gm, ''), createContext({ document }));
  buttons[1].click();
  assert.deepEqual(parts.map((part) => part.hidden), [true, true, false]);
  assert.deepEqual(buttons.map((button) => button.pressed), ['false', 'true']);
  buttons[0].click();
  assert.deepEqual(parts.map((part) => part.hidden), [false, false, true]);
  assert.deepEqual(buttons.map((button) => button.pressed), ['true', 'false']);
});

test('generated crate and order confirmation use decorative SVGs', () => {
  const { context, elements } = renderApp();
  const crate = elements.get('#room-crate').innerHTML;
  assert.equal((crate.match(/class="crate-indicator"><svg\b[^>]*aria-hidden="true"/g) || []).length, products.length);
  assert.match(crate, /aria-label="Explore .+ in the listening room"/);

  runInContext("showSuccess({ id: 'TEST', items: [{ id: 'way-home', quantity: 1 }], totals: { total: 2800 }, delivery: 'standard', date: '2026-01-01' })", context);
  const confirmation = elements.get('#dialog-content').innerHTML;
  assert.match(confirmation, /class="success-emblem" aria-hidden="true"><svg\b[^>]*aria-hidden="true"[^>]*>.*?<\/svg><span><svg\b[^>]*aria-hidden="true"/);
  assert.match(confirmation, /GOOD SOUNDS ARE ON THE HORIZON/);
  assert.match(confirmation, /Download demo receipt/);
});
