import { products } from './catalog.js';

export const money = (cents) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(cents / 100);
export const findProduct = (id) => products.find((product) => product.id === id);

export function validateCart(value) {
  if (!Array.isArray(value)) throw new Error('The saved bag is not a list.');
  const seen = new Set();
  return value.map((item) => {
    const product = item && findProduct(item.id);
    if (!product || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > product.stock || seen.has(item.id)) {
      throw new Error('The saved bag contains an invalid record or quantity.');
    }
    seen.add(item.id);
    return { id: item.id, quantity: item.quantity };
  });
}

export function totals(cart, delivery = 'standard') {
  if (!['standard', 'express'].includes(delivery)) throw new Error('Unknown delivery method.');
  const valid = validateCart(cart);
  const subtotal = valid.reduce((sum, item) => sum + findProduct(item.id).price * item.quantity, 0);
  const shipping = subtotal === 0 ? 0 : delivery === 'express' ? 1400 : subtotal >= 7500 ? 0 : 600;
  const tax = Math.round(subtotal * 0.0825);
  return { subtotal, shipping, tax, total: subtotal + shipping + tax };
}

export function filterProducts({ genre = 'all', search = '', newOnly = false, sort = 'featured' } = {}) {
  const term = search.trim().toLowerCase();
  const result = products.filter((p) => (genre === 'all' || p.genre === genre)
    && (!newOnly || p.condition === 'New pressing')
    && (!term || `${p.title} ${p.artist} ${p.category} ${p.edition}`.toLowerCase().includes(term)));
  if (sort === 'price-low') result.sort((a, b) => a.price - b.price);
  if (sort === 'price-high') result.sort((a, b) => b.price - a.price);
  if (sort === 'title') result.sort((a, b) => a.title.localeCompare(b.title));
  return result;
}
