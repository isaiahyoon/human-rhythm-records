import test from 'node:test';
import assert from 'node:assert/strict';
import { totals, validateCart, filterProducts } from './shop.js';

test('standard shipping switches to free at the $75 threshold', () => {
  assert.equal(totals([{ id: 'way-home', quantity: 1 }, { id: 'blue-hour', quantity: 1 }, { id: 'sunday-service', quantity: 1 }]).shipping, 600);
  const atThreshold = totals([{ id: 'after-the-launch', quantity: 1 }, { id: 'sunday-service', quantity: 1 }, { id: 'blue-hour', quantity: 1 }]);
  assert.equal(atThreshold.subtotal, 7500);
  assert.equal(atThreshold.shipping, 0);
  assert.equal(atThreshold.tax, 619);
  assert.equal(atThreshold.total, 8119);
});

test('express retains its rate above the free standard shipping threshold', () => {
  assert.deepEqual(totals([{ id: 'way-home', quantity: 3 }], 'express'), { subtotal: 8400, shipping: 1400, tax: 693, total: 10493 });
  assert.deepEqual(totals([]), { subtotal: 0, shipping: 0, tax: 0, total: 0 });
});

test('saved bags reject unknown, duplicate, fractional, and overstock lines', () => {
  for (const invalid of [null, {}, [{ id: 'missing', quantity: 1 }], [{ id: 'way-home', quantity: 0 }], [{ id: 'way-home', quantity: 1.5 }], [{ id: 'way-home', quantity: 9 }], [{ id: 'way-home', quantity: 1 }, { id: 'way-home', quantity: 2 }]]) {
    assert.throws(() => validateCart(invalid));
  }
  assert.deepEqual(validateCart([{ id: 'way-home', quantity: 2, extra: true }]), [{ id: 'way-home', quantity: 2 }]);
});

test('search combines genre and pressing filters and sorts numeric prices', () => {
  assert.equal(filterProducts({ search: '  VELVET meadow ' })[0].id, 'soft-focus');
  assert.equal(filterProducts({ search: 'no-such-record' }).length, 0);
  assert.equal(filterProducts({ genre: 'soul', newOnly: true }).length, 0);
  const roots = filterProducts({ genre: 'roots', sort: 'price-low' });
  assert.deepEqual(roots.map((p) => p.id), ['open-country', 'way-home']);
  const high = filterProducts({ sort: 'price-high' });
  assert.equal(high[0].id, 'electric-garden');
});
