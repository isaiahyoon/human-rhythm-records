import './styles.css';
import { products, coverUrl } from './catalog.js';
import { money, findProduct, totals, validateCart, filterProducts } from './shop.js';

const icons = {
  'arrow-right': '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  'arrow-up-right': '<path d="M6 18 18 6M6 6h12v12"/>',
  spark: '<path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  bag: '<path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  box: '<path d="m12 3 9 5-9 5-9-5 9-5ZM3 8v9l9 5 9-5V8M12 13v9M7 5.8l9.5 5.3"/>',
  record: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M6 12a6 6 0 0 1 6-6m0 12a6 6 0 0 0 6-6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  back: '<path d="M20 12H5m6-6-6 6 6 6"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.record}</svg>`;
const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const dialog = document.querySelector('#shop-dialog');
const content = document.querySelector('#dialog-content');
const state = { cart: [], genre: 'all', search: '', sort: 'featured', newOnly: false, expanded: false, delivery: 'standard', shipping: {}, step: 1, screen: '', room: { id: products[0].id, view: 'platter', side: 'a' } };
let toastTimer;

function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('visible'), 4200);
}

function persistCart() {
  try {
    localStorage.setItem('human-rhythm-bag-v1', JSON.stringify(state.cart));
  } catch (error) {
    console.error('Could not save your bag:', error);
    toast('Your bag works for this visit, but your browser could not save it.');
  }
}

function loadCart() {
  try {
    const saved = localStorage.getItem('human-rhythm-bag-v1') ?? localStorage.getItem('jasas-bag-v1');
    if (saved !== null) state.cart = validateCart(JSON.parse(saved));
  } catch (error) {
    console.error('Could not restore your bag:', error);
    toast('Your saved bag could not be restored. Please add your records again.');
  }
}

function updateBagCount() {
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelector('.cart-count').textContent = count;
  document.querySelector('.bag-button').setAttribute('aria-label', `Open bag, ${count} ${count === 1 ? 'record' : 'records'}`);
}

function addToCart(id) {
  const product = findProduct(id);
  if (!product) return;
  const item = state.cart.find((line) => line.id === id);
  if (item && item.quantity >= product.stock) {
    toast(`Just ${product.stock} copies of this one in our demo crate.`);
    return;
  }
  if (item) item.quantity += 1;
  else state.cart.push({ id, quantity: 1 });
  persistCart();
  updateBagCount();
  toast(`${product.title} added to your bag.`);
  const addButton = content.querySelector('[data-action="add"]');
  if (state.screen === 'product' && addButton) {
    addButton.innerHTML = `${icon('check')} Added to your bag`;
    addButton.classList.add('added');
  }
}

function renderCatalog() {
  const filtered = filterProducts(state);
  const visible = state.expanded ? filtered : filtered.slice(0, 4);
  document.querySelector('#product-grid').innerHTML = visible.length ? visible.map((p) => `
    <article class="product-card">
      <div class="product-visual" style="--sleeve-bg:${p.color}">
        ${p.tag ? `<span class="product-tag">${p.tag}</span>` : ''}
        <button class="product-cover-button" data-action="product" data-id="${p.id}" aria-label="View ${p.title} by ${escapeHtml(p.artist)}">
          <span class="peek-vinyl" aria-hidden="true"></span>
          <img src="${coverUrl(p)}" alt="${escapeHtml(p.title)} original illustrated album cover" width="400" height="400" loading="lazy" />
        </button>
        <button class="quick-add" data-action="add" data-id="${p.id}" aria-label="Add ${p.title} to bag">${icon('plus')}</button>
      </div>
      <div class="product-category">${p.category}</div>
      <div class="product-title-row"><h3><button data-action="product" data-id="${p.id}">${p.title}</button></h3><span>${money(p.price)}</span></div>
      <p class="product-artist">${escapeHtml(p.artist)}</p>
      <div class="product-edition"><span class="condition-dot ${p.condition.startsWith('Pre') ? 'pre-loved' : ''}"></span>${p.condition}<span class="edition-divider">/</span>${p.edition}</div>
    </article>`).join('') : `<div class="no-results"><span aria-hidden="true">${icon('record')}</span><h3>No records in this crate.</h3><p>Try a different artist, album, or sound.</p><button class="button button-outline" data-action="all-records">Browse all records ${icon('arrow-right')}</button></div>`;
  document.querySelector('#record-count').textContent = `Showing ${visible.length} of ${filtered.length} records`;
  document.querySelector('#load-more').hidden = visible.length >= filtered.length;
  document.querySelectorAll('.genre-tab').forEach((tab) => {
    const active = tab.dataset.genre === state.genre;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-pressed', active);
  });
  const filter = document.querySelector('.search-filter');
  filter.hidden = !state.search && !state.newOnly;
  filter.querySelector('span').textContent = state.search ? `Digging for “${state.search}”` : 'Fresh arrivals · new pressings only';
  document.querySelector('#records-heading').innerHTML = state.newOnly ? 'New to the crate<span class="title-dot">.</span>' : 'In rotation now<span class="title-dot">.</span>';
}

function renderRoom() {
  const product = findProduct(state.room.id);
  const artwork = coverUrl(product);
  const split = Math.ceil(product.tracks.length / 2);
  const offset = state.room.side === 'a' ? 0 : split;
  const tracks = state.room.side === 'a' ? product.tracks.slice(0, split) : product.tracks.slice(split);
  document.querySelector('#platter-art').src = artwork;
  const sleeve = document.querySelector('#room-sleeve-art');
  sleeve.src = artwork;
  sleeve.alt = `${product.title} by ${product.artist}, original sleeve artwork`;
  sleeve.hidden = state.room.view !== 'sleeve';
  document.querySelector('.room-platter').hidden = state.room.view !== 'platter';
  document.querySelector('.room-tonearm').toggleAttribute('hidden', state.room.view !== 'platter');
  document.querySelector('#room-display-title').textContent = product.title;
  document.querySelectorAll('[data-action="room-view"]').forEach((button) => {
    const active = button.dataset.view === state.room.view;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active);
  });
  document.querySelectorAll('[data-action="room-record"]').forEach((button) => {
    const active = button.dataset.id === product.id;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active);
  });
  document.querySelector('#room-selection').innerHTML = `<span class="eyebrow">IN ROTATION / ${product.category}</span><h3>${product.title}</h3><p class="room-artist">${escapeHtml(product.artist)}</p><p class="room-description">${product.description}</p>
    <div class="room-side-controls" role="group" aria-label="Record side"><button data-action="room-side" data-side="a" class="${state.room.side === 'a' ? 'active' : ''}" aria-pressed="${state.room.side === 'a'}">Side A</button><button data-action="room-side" data-side="b" class="${state.room.side === 'b' ? 'active' : ''}" aria-pressed="${state.room.side === 'b'}">Side B</button><span>12″ LP / ${product.year}</span></div>
    <ol class="room-tracks" start="${offset + 1}">${tracks.map((track, i) => `<li><span>${String(offset + i + 1).padStart(2, '0')}</span>${track}</li>`).join('')}</ol>
    <div class="room-pressing"><span class="condition-dot ${product.condition.startsWith('Pre') ? 'pre-loved' : ''}"></span>${product.condition}<span>/</span>${product.edition}</div>
    <div class="room-shop-actions"><button class="button button-cream" data-action="product" data-id="${product.id}">Explore the pressing ${icon('arrow-up-right')}</button><button class="room-add-button" data-action="add" data-id="${product.id}" aria-label="Add ${product.title} to bag from listening room">${money(product.price)} ${icon('plus')}</button></div>`;
}

function selectRoomRecord(id) {
  state.room.id = id;
  state.room.side = 'a';
  renderRoom();
}

function initializeRoom() {
  document.querySelector('#room-crate').innerHTML = products.map((product) => `<button class="room-crate-record" data-action="room-record" data-id="${product.id}" aria-label="Explore ${product.title} in the listening room" aria-pressed="false"><img src="${coverUrl(product)}" alt="" width="52" height="52" loading="lazy" /><span><strong>${product.title}</strong><small>${escapeHtml(product.artist)}</small></span><span class="crate-indicator">${icon('arrow-up-right')}</span></button>`).join('');
  renderRoom();
}

function openDialog(screen, label, className = '') {
  state.screen = screen;
  dialog.className = className;
  dialog.setAttribute('aria-label', label);
  dialog.append(document.querySelector('#toast'));
  if (!dialog.open) dialog.showModal();
  document.body.classList.add('modal-open');
  content.scrollTop = 0;
  dialog.scrollTop = 0;
  content.querySelector('button, input, [tabindex]')?.focus({ preventScroll: true });
}

const closeButton = () => `<button class="icon-button dialog-close" data-action="close" aria-label="Close dialog">${icon('close')}</button>`;

function showProduct(id) {
  const p = findProduct(id);
  if (!p) return;
  content.innerHTML = `${closeButton()}
    <div class="product-detail">
      <div class="detail-art" style="--sleeve-bg:${p.color}"><img src="${coverUrl(p)}" alt="${escapeHtml(p.title)} album cover" width="400" height="400"/><span>THE REAL THING. ON WAX.</span></div>
      <div class="detail-copy"><span class="eyebrow">${p.category} / ${p.year}</span><h2>${p.title}</h2><p class="detail-artist">${escapeHtml(p.artist)}</p><p class="detail-price">${money(p.price)} <span>USD</span></p><p>${p.description}</p>
      <div class="pressing-info"><span class="condition-dot ${p.condition.startsWith('Pre') ? 'pre-loved' : ''}"></span><strong>${p.condition}</strong><span>${p.edition} · 12″ LP · 33⅓ RPM</span></div>
      <p class="stock-note">${p.stock <= 3 ? `Only ${p.stock} ${p.stock === 1 ? 'copy' : 'copies'} in the crate` : 'In the crate & ready to spin'} <span>· Demo inventory</span></p>
      <button class="button button-dark full-width" data-action="add" data-id="${p.id}">Add to your bag ${icon('plus')}</button>
      <button class="text-link detail-bag" data-action="cart">View your bag ${icon('arrow-right')}</button>
      <details class="tracklist"><summary>The tracklist <span>+</span></summary><ol>${p.tracks.map((track, i) => `<li><span>${String(i + 1).padStart(2, '0')}</span>${track}</li>`).join('')}</ol></details>
      <details class="detail-shipping"><summary>Shipping & condition <span>+</span></summary><p>U.S. standard shipping is $6, free at $75. Express is $14. New records are sealed; pre-loved VG+ records may have light cosmetic wear but no major playback issues. All inventory is fictional; this demo ships nothing.</p></details></div>
    </div>`;
  openDialog('product', `${p.title} record details`, 'product-modal');
}

function bagLines(compact = false) {
  return state.cart.map((item) => {
    const p = findProduct(item.id);
    return `<div class="bag-line ${compact ? 'compact' : ''}">
      <img src="${coverUrl(p)}" alt="${escapeHtml(p.title)} cover" width="88" height="88" />
      <div class="bag-line-copy"><h3>${p.title}</h3><p>${escapeHtml(p.artist)}</p><span>${p.edition}</span>
      ${compact ? `<p class="compact-quantity">Qty ${item.quantity}</p>` : `<div class="quantity-controls"><button data-action="quantity" data-id="${p.id}" data-change="-1" aria-label="Decrease quantity of ${p.title}">${icon('minus')}</button><span aria-label="Quantity">${item.quantity}</span><button data-action="quantity" data-id="${p.id}" data-change="1" aria-label="Increase quantity of ${p.title}" ${item.quantity >= p.stock ? 'disabled' : ''}>${icon('plus')}</button></div>`}</div>
      <div class="bag-line-end"><strong>${money(p.price * item.quantity)}</strong>${!compact ? `<button data-action="remove" data-id="${p.id}" aria-label="Remove ${p.title}">Remove</button>` : ''}</div>
    </div>`;
  }).join('');
}

function totalsMarkup(delivery = state.delivery) {
  const t = totals(state.cart, delivery);
  return `<dl class="order-totals"><div><dt>Subtotal</dt><dd>${money(t.subtotal)}</dd></div><div><dt>Shipping${delivery === 'express' ? ' · Express' : ''}</dt><dd>${t.shipping === 0 ? 'On us' : money(t.shipping)}</dd></div><div><dt>Estimated tax (8.25%)</dt><dd>${money(t.tax)}</dd></div><div class="grand-total"><dt>Total <small>USD</small></dt><dd>${money(t.total)}</dd></div></dl>`;
}

function showCart() {
  const { subtotal } = totals(state.cart);
  const remaining = Math.max(0, 7500 - subtotal);
  content.innerHTML = `<div class="drawer-header"><div><span class="eyebrow">GOOD CHOICES, GOOD SOUNDS</span><h2>Your bag<span class="title-dot">.</span> <small>(${state.cart.reduce((sum, item) => sum + item.quantity, 0)})</small></h2></div>${closeButton()}</div>
    ${state.cart.length ? `<div class="shipping-progress"><p>${remaining ? `You’re ${money(remaining)} away from free standard shipping.` : 'Your standard shipping is on us. Nice.'}</p><div><span style="width:${Math.min(100, subtotal / 75)}%"></span></div></div><div class="bag-lines">${bagLines()}</div><div class="bag-bottom">${totalsMarkup('standard')}<button class="button button-dark full-width" data-action="checkout">Let’s make it yours ${icon('arrow-right')}</button><p class="demo-disclaimer">${icon('lock')} Demo checkout. No real payment or shipment.</p><button class="text-link continue-shopping" data-action="close">Keep digging</button></div>` : `<div class="empty-bag"><span class="empty-record" aria-hidden="true">◎</span><h3>Room for a good record.</h3><p>Your next favorite is somewhere in the crates.</p><button class="button button-dark" data-action="shop">Let’s find it ${icon('arrow-right')}</button></div>`}`;
  openDialog('cart', 'Your shopping bag', 'cart-drawer');
}

function checkoutSummary() {
  return `<aside class="checkout-summary"><span class="eyebrow">THE GOOD STUFF YOU FOUND</span><div class="summary-lines">${bagLines(true)}</div><div id="checkout-totals">${totalsMarkup()}</div><div class="summary-note">${icon('box')} Packed with care. Made to be played.<br /><span>Demo only. No goods will be shipped.</span></div></aside>`;
}

function shippingField(name, label, autocomplete, options = '') {
  return `<label class="form-field ${name === 'address' || name === 'email' || name === 'country' ? 'field-full' : ''}" for="shipping-${name}">${label}<input id="shipping-${name}" name="${name}" value="${escapeHtml(state.shipping[name] || '')}" autocomplete="${autocomplete}" required ${options} /></label>`;
}

function showCheckout(step = 1) {
  if (!state.cart.length) return showCart();
  state.step = step;
  let form;
  if (step === 1) {
    form = `<form id="shipping-form"><span class="eyebrow">01 / YOUR DETAILS</span><h2>Where’s the music going?</h2><p class="checkout-intro">Just the essentials. Your details stay in this visit.</p><div class="form-grid">
      ${shippingField('email', 'Email address', 'email', 'type="email" maxlength="160"')}
      ${shippingField('first', 'First name', 'given-name', 'maxlength="60"')}
      ${shippingField('last', 'Last name', 'family-name', 'maxlength="60"')}
      ${shippingField('address', 'Street address', 'street-address', 'maxlength="180"')}
      <label class="form-field field-full" for="shipping-apartment">Apartment, suite, etc. <span>(optional)</span><input id="shipping-apartment" name="apartment" value="${escapeHtml(state.shipping.apartment || '')}" autocomplete="address-line2" maxlength="80" /></label>
      ${shippingField('city', 'City', 'address-level2', 'maxlength="80"')}
      <label class="form-field" for="shipping-state">State<select id="shipping-state" name="state" required autocomplete="address-level1"><option value="">Select state</option>${states.map(([code, name]) => `<option value="${code}" ${state.shipping.state === code ? 'selected' : ''}>${name}</option>`).join('')}</select></label>
      ${shippingField('zip', 'ZIP code', 'postal-code', 'inputmode="numeric" pattern="[0-9]{5}(-[0-9]{4})?" title="Enter a 5-digit ZIP code, or ZIP+4" maxlength="10"')}
      <label class="form-field" for="shipping-country">Country<select id="shipping-country" name="country" autocomplete="country-name"><option>United States</option></select></label>
      </div><button class="button button-dark full-width" type="submit">Continue to delivery ${icon('arrow-right')}</button><p class="form-footnote">U.S. addresses only for this demo. You can use fictional details.</p></form>`;
  } else if (step === 2) {
    const standard = totals(state.cart, 'standard').shipping;
    form = `<form id="delivery-form"><span class="eyebrow">02 / THE JOURNEY</span><h2>A good journey home.</h2><p class="checkout-intro">Choose how your records would travel.</p><div class="address-preview"><div><strong>${escapeHtml(state.shipping.first)} ${escapeHtml(state.shipping.last)}</strong><p>${escapeHtml(state.shipping.address)}${state.shipping.apartment ? `, ${escapeHtml(state.shipping.apartment)}` : ''}<br />${escapeHtml(state.shipping.city)}, ${escapeHtml(state.shipping.state)} ${escapeHtml(state.shipping.zip)}</p></div><button type="button" class="text-link" data-action="checkout-step" data-step="1">Edit</button></div>
      <label class="delivery-option ${state.delivery === 'standard' ? 'selected' : ''}"><input type="radio" name="delivery" value="standard" ${state.delivery === 'standard' ? 'checked' : ''} /><span><strong>The scenic route</strong><small>Standard shipping · 5–8 business days</small></span><b>${standard ? money(standard) : 'Free'}</b></label>
      <label class="delivery-option ${state.delivery === 'express' ? 'selected' : ''}"><input type="radio" name="delivery" value="express" ${state.delivery === 'express' ? 'checked' : ''} /><span><strong>A little more rocket fuel</strong><small>Express shipping · 2–3 business days</small></span><b>$14.00</b></label>
      <div class="packing-note">${icon('box')} Every record gets a proper mailer and a little extra care.</div><button class="button button-dark full-width" type="submit">Review your records ${icon('arrow-right')}</button><p class="form-footnote">Delivery times are illustrative. This demo ships nothing.</p></form>`;
  } else {
    const s = state.shipping;
    form = `<form id="review-form"><span class="eyebrow">03 / ONE LAST LOOK</span><h2>Almost ready to spin.</h2><p class="checkout-intro">Everything look right? Let’s give these records a home.</p>
      <div class="review-block"><div class="review-label"><h3>Shipping to</h3><button type="button" class="text-link" data-action="checkout-step" data-step="1">Edit</button></div><p>${escapeHtml(s.first)} ${escapeHtml(s.last)}<br />${escapeHtml(s.address)}${s.apartment ? `, ${escapeHtml(s.apartment)}` : ''}<br />${escapeHtml(s.city)}, ${escapeHtml(s.state)} ${escapeHtml(s.zip)}<br />United States</p><p>${escapeHtml(s.email)}</p></div>
      <div class="review-block"><div class="review-label"><h3>Delivery</h3><button type="button" class="text-link" data-action="checkout-step" data-step="2">Edit</button></div><p>${state.delivery === 'standard' ? 'The scenic route · 5–8 business days' : 'A little more rocket fuel · 2–3 business days'}</p></div>
      <div class="demo-payment">${icon('lock')}<div><strong>No wallet needed.</strong><p>This is a demo order. No card details, no charges, no shipment, and no confirmation email.</p></div><span>DEMO</span></div>
      <label class="demo-consent"><input type="checkbox" name="demo-consent" required /><span>I understand this is a demo and no real purchase will be made.</span></label>
      <button class="button button-dark full-width" type="submit">Place demo order · ${money(totals(state.cart, state.delivery).total)} ${icon('arrow-right')}</button></form>`;
  }
  content.innerHTML = `<div class="checkout-header"><button class="text-link" data-action="${step === 1 ? 'cart' : 'checkout-step'}" data-step="${step - 1}">${icon('back')} ${step === 1 ? 'Back to bag' : 'Back'}</button><span>THE CHECKOUT / A DEMO, NOT A CHARGE</span>${closeButton()}</div>
    <div class="checkout-steps" aria-label="Checkout progress">${['Your details', 'Delivery', 'Review & finish'].map((label, index) => `<span class="${index + 1 === step ? 'current' : index + 1 < step ? 'complete' : ''}" ${index + 1 === step ? 'aria-current="step"' : ''}><b>${index + 1 < step ? icon('check') : `0${index + 1}`}</b>${label}</span>`).join('<i></i>')}</div>
    <div class="checkout-layout"><div class="checkout-form">${form}</div>${checkoutSummary()}</div>`;
  openDialog('checkout', `Checkout: ${['Your details', 'Delivery', 'Review and finish'][step - 1]}`, 'checkout-modal');
  content.querySelector('h2')?.setAttribute('tabindex', '-1');
  content.querySelector('h2')?.focus({ preventScroll: true });
}

function completeOrder() {
  const order = { id: `HRR-${Date.now().toString(36).toUpperCase()}`, items: state.cart.map((item) => ({ ...item })), delivery: state.delivery, totals: totals(state.cart, state.delivery), date: new Date().toISOString() };
  try {
    localStorage.setItem('human-rhythm-last-demo-order-v1', JSON.stringify(order));
  } catch (error) {
    console.error('Could not save demo order:', error);
    toast('Demo complete, but this browser could not save your order receipt.');
  }
  state.cart = [];
  state.shipping = {};
  state.delivery = 'standard';
  persistCart();
  updateBagCount();
  showSuccess(order);
}

function showSuccess(order) {
  const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
  content.innerHTML = `${closeButton()}<div class="success-screen"><div class="success-emblem" aria-hidden="true">${icon('check')}<span>${icon('spark')}</span></div><span class="eyebrow">GOOD SOUNDS ARE ON THE HORIZON</span><h2>A very good<br /><em>demo decision.</em></h2><p>You made it from the crate to the finish.<br />Thanks for spending a little time with Human Rhythm.</p><div class="success-receipt"><div><span>DEMO ORDER</span><strong>${escapeHtml(order.id)}</strong></div><div><span>${count} ${count === 1 ? 'RECORD' : 'RECORDS'}</span><strong>${money(order.totals.total)}</strong></div></div><p class="success-notice">Nothing was charged. Nothing will ship.<br />No email was sent. Just a little analog daydream.</p><div class="success-actions"><button class="button button-dark" data-action="shop">Back to the good stuff ${icon('arrow-right')}</button><a class="text-link" href="data:text/plain;charset=utf-8,${encodeURIComponent(receiptText(order))}" download="${escapeHtml(order.id)}-demo-receipt.txt">Download demo receipt ${icon('arrow-up-right')}</a></div></div>`;
  openDialog('success', 'Demo order complete', 'success-modal');
}

function receiptText(order) {
  return `HUMAN RHYTHM RECORDS\nDEMO RECEIPT — NOT A REAL PURCHASE\n\nOrder: ${order.id}\nDate: ${new Date(order.date).toLocaleString('en-US')}\n\n${order.items.map((item) => {
    const p = findProduct(item.id);
    return `${item.quantity} x ${p.title} — ${p.artist}    ${money(p.price * item.quantity)}`;
  }).join('\n')}\n\nSubtotal: ${money(order.totals.subtotal)}\nShipping (${order.delivery}): ${money(order.totals.shipping)}\nEstimated tax (8.25%): ${money(order.totals.tax)}\nDemo total: ${money(order.totals.total)}\n\nNo payment was collected. No products will ship. No email was sent.\nDeep grooves. Good company. All heart.\n`;
}

function showSearch() {
  content.innerHTML = `${closeButton()}<div class="search-panel"><span class="eyebrow">SOMETHING GOOD IS IN HERE</span><h2>Go on. Dig a little.</h2><form id="search-form"><label class="sr-only" for="record-search">Search artist, album, or sound</label><div class="search-input-wrap">${icon('search')}<input id="record-search" name="search" type="search" placeholder="Artist, album, or a kind of feeling…" value="${escapeHtml(state.search)}" autocomplete="off" maxlength="100" /><button class="button button-dark" type="submit">Find it ${icon('arrow-right')}</button></div></form><p class="search-hint">Try “soul”, “jazz”, or “Velvet Meadow”.</p><div id="search-results"></div></div>`;
  openDialog('search', 'Search records', 'search-modal');
  renderSearchResults(state.search);
  content.querySelector('#record-search').focus();
}

function renderSearchResults(search) {
  const found = filterProducts({ search });
  content.querySelector('#search-results').innerHTML = `<span class="eyebrow">${search.trim() ? `${found.length} RECORD${found.length === 1 ? '' : 'S'} FOUND` : 'A FEW GOOD PLACES TO START'}</span>${found.length ? found.slice(0, 4).map((p) => `<button class="search-result" data-action="product" data-id="${p.id}"><img src="${coverUrl(p)}" alt="" width="56" height="56"/><span><strong>${p.title}</strong><small>${escapeHtml(p.artist)} · ${p.category}</small></span><b>${money(p.price)}</b>${icon('arrow-up-right')}</button>`).join('') : '<p class="search-empty">No matches yet. Try another artist, album, or genre.</p>'}`;
}

function showInfo(type) {
  const shipping = type === 'shipping-info';
  content.innerHTML = `${closeButton()}<div class="info-panel"><span class="eyebrow">${shipping ? 'FROM OUR CRATE TO YOURS' : 'HUMAN RHYTHM RECORDS / THE DEMO'}</span><h2>${shipping ? 'A little care goes a long way.' : 'A shop to take for a spin.'}</h2>${shipping ? '<h3>Shipping</h3><p>Demo standard U.S. shipping is $6, or free on orders of $75 or more. Express is $14. Estimated transit is 5–8 business days standard or 2–3 business days express.</p><h3>Condition & returns</h3><p>Our fictional new records are sealed. Pre-loved VG+ records may have light sleeve or surface wear, without significant playback issues. A real shop would offer a 30-day return window for damaged or incorrectly described items.</p><p class="info-callout">This is a demo. No orders are fulfilled and there is no real returns service.</p>' : '<p>Human Rhythm Records is a fully interactive storefront demo shaped by soul, jazz, funk, and the human stories carried in a record sleeve.</p><p>Every artist, album, pressing, price, and inventory count in the catalog is fictional. Original vector covers sit beside supplied Human Rhythm Records artwork.</p><p>The bag is saved in your browser. Checkout details stay in memory and are cleared when you finish or reload. A demo receipt is saved locally without your name, email, or address. No payment processor, email service, or fulfillment service is connected.</p><p class="info-callout">The only outside requests are optional Google Fonts. No private recording is included.</p>'}<button class="button button-dark" data-action="close">Sounds good ${icon('check')}</button></div>`;
  openDialog('info', shipping ? 'Shipping and returns demo policy' : 'About this demo', 'info-modal');
}

function shopWithFilter(options) {
  Object.assign(state, { genre: 'all', search: '', newOnly: false, expanded: true, ...options });
  renderCatalog();
  if (dialog.open) dialog.close();
  document.querySelector('#records').scrollIntoView({ behavior: 'smooth' });
}

const states = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
];

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action], [data-genre]');
  if (!target) return;
  if (target.dataset.genre) {
    state.genre = target.dataset.genre;
    state.newOnly = false;
    state.expanded = true;
    renderCatalog();
    return;
  }
  event.preventDefault();
  const { action, id } = target.dataset;
  if (action === 'product') showProduct(id);
  else if (action === 'add') addToCart(id);
  else if (action === 'cart') showCart();
  else if (action === 'close') dialog.close();
  else if (action === 'shop') shopWithFilter({});
  else if (action === 'search') showSearch();
  else if (action === 'all-records') shopWithFilter({});
  else if (action === 'new-arrivals') shopWithFilter({ newOnly: true });
  else if (action === 'slow-records') shopWithFilter({ genre: 'ambient' });
  else if (action === 'load-more') { state.expanded = true; renderCatalog(); }
  else if (action === 'clear-search') { state.search = ''; state.newOnly = false; renderCatalog(); }
  else if (action === 'checkout') showCheckout(1);
  else if (action === 'checkout-step') showCheckout(Number(target.dataset.step));
  else if (action === 'shipping-info' || action === 'demo-info') showInfo(action);
  else if (action === 'room-record') {
    selectRoomRecord(id);
    document.querySelector('.room-console').scrollIntoView({ block: 'nearest' });
  }
  else if (action === 'room-next' || action === 'room-previous') {
    const index = products.findIndex((product) => product.id === state.room.id);
    const direction = action === 'room-next' ? 1 : -1;
    selectRoomRecord(products[(index + direction + products.length) % products.length].id);
  } else if (action === 'room-view') {
    state.room.view = target.dataset.view;
    renderRoom();
  } else if (action === 'room-side') {
    state.room.side = target.dataset.side;
    renderRoom();
    document.querySelector(`[data-action="room-side"][data-side="${state.room.side}"]`).focus({ preventScroll: true });
  } else if (action === 'remove' || action === 'quantity') {
    const item = state.cart.find((line) => line.id === id);
    if (!item) return;
    const next = action === 'remove' ? 0 : item.quantity + Number(target.dataset.change);
    if (next > findProduct(id).stock) return toast('Every available copy is already in your bag.');
    if (next <= 0) state.cart = state.cart.filter((line) => line.id !== id);
    else item.quantity = next;
    persistCart();
    updateBagCount();
    showCart();
    const nextControl = content.querySelector(`[data-action="quantity"][data-id="${id}"][data-change="${next >= findProduct(id).stock ? '-1' : target.dataset.change}"]`);
    nextControl?.focus({ preventScroll: true });
  }
});

document.addEventListener('submit', (event) => {
  const form = event.target;
  if (form.id === 'newsletter-form') {
    event.preventDefault();
    document.querySelector('#newsletter-status').textContent = 'You’re tuned in—for this demo. No email was saved or subscription created.';
    form.reset();
  } else if (form.id === 'search-form') {
    event.preventDefault();
    shopWithFilter({ search: new FormData(form).get('search').trim() });
  } else if (form.id === 'shipping-form') {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(form));
    for (const [name, value] of Object.entries(fields)) {
      fields[name] = value.trim();
      const input = form.elements.namedItem(name);
      if (input.required && !fields[name]) {
        input.setCustomValidity('Please enter this detail, not just spaces.');
        input.reportValidity();
        return;
      }
    }
    state.shipping = fields;
    showCheckout(2);
  } else if (form.id === 'delivery-form') {
    event.preventDefault();
    state.delivery = new FormData(form).get('delivery');
    showCheckout(3);
  } else if (form.id === 'review-form') {
    event.preventDefault();
    completeOrder();
  }
});

document.addEventListener('input', (event) => {
  if (event.target.id === 'record-search') renderSearchResults(event.target.value);
  if (event.target.closest('#shipping-form')) event.target.setCustomValidity('');
});

document.addEventListener('change', (event) => {
  if (event.target.id === 'sort') {
    state.sort = event.target.value;
    renderCatalog();
  }
  if (event.target.name === 'delivery') {
    state.delivery = event.target.value;
    content.querySelectorAll('.delivery-option').forEach((option) => option.classList.toggle('selected', option.querySelector('input').checked));
    content.querySelector('#checkout-totals').innerHTML = totalsMarkup();
  }
});

dialog.addEventListener('click', (event) => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  document.body.append(document.querySelector('#toast'));
});

document.querySelectorAll('[data-icon]').forEach((element) => { element.innerHTML = icon(element.dataset.icon); });
document.querySelector('#year').textContent = new Date().getFullYear();
loadCart();
updateBagCount();
renderCatalog();
initializeRoom();
