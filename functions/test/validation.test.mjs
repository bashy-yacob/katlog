import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import express from 'express';
import { createServer } from 'node:http';
import { OrderValidationError, normalizePhone, pickupToday, validateOrderRequest } from '../lib/order-validation.js';

const now = new Date('2026-10-20T10:00:00Z');
const input = () => ({ idempotencyKey: '16b6038c-1f16-4324-996b-c31d10a702dd', productId: 'product', customerName: 'לקוחה לבדיקה', customerPhone: '050-1234567', customerEmail: '', quantity: 10, requestedPickupDate: '2026-10-21', customizationNotes: '', requestedText: '', preferredColors: '' });
test('validates the minimum request without requiring email or customer login', () => {
  const valid = validateOrderRequest(input(), now);
  assert.equal(valid.quantity, 10); assert.equal(valid.customerEmail, ''); assert.equal(valid.customerPhone, '+972501234567');
});
test('enforces integer quantities and rejects coercion in direct API calls', () => {
  for (const quantity of [9, 0, -1, 10.5, '10', null, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => validateOrderRequest({ ...input(), quantity }, now), error => error instanceof OrderValidationError && Boolean(error.fields.quantity));
  }
});
test('rejects invented, past and malformed pickup dates', () => {
  for (const date of ['2026-02-30', '2026-10-19', '2026-13-01', 'yesterday', '2026-1-1']) assert.throws(() => validateOrderRequest({ ...input(), requestedPickupDate: date }, now));
  assert.equal(validateOrderRequest({ ...input(), requestedPickupDate: '2026-10-19' }, now, false).requestedPickupDate, '2026-10-19');
});
test('uses the Jerusalem business date around midnight rather than the host timezone', () => {
  assert.equal(pickupToday(new Date('2026-10-20T22:30:00Z')), '2026-10-21');
  assert.throws(() => validateOrderRequest({ ...input(), requestedPickupDate: '2026-10-20' }, new Date('2026-10-20T22:30:00Z')));
});
test('rejects price, status, customer address and other untrusted fields', () => {
  for (const key of ['quotedPrice', 'price', 'status', 'productSnapshot', 'shippingAddress', 'internalNotes']) assert.throws(() => validateOrderRequest({ ...input(), [key]: 'injected' }, now));
});
test('bounds text fields and rejects invalid phones, email, keys and product paths', () => {
  for (const patch of [{ customerName: 'א'.repeat(121) }, { customizationNotes: 'x'.repeat(2001) }, { preferredColors: 'x'.repeat(501) }, { requestedText: 'x'.repeat(251) }, { customerEmail: 'wrong@email' }, { customerPhone: '123' }, { idempotencyKey: 'predictable' }, { productId: 'other/product' }, { customerName: 'a\0b' }]) assert.throws(() => validateOrderRequest({ ...input(), ...patch }, now));
});
test('normalizes equivalent Israeli phone representations for rate limiting', () => {
  assert.equal(normalizePhone('050-1234567'), normalizePhone('+972 50 1234567'));
  assert.equal(normalizePhone('00972 50 1234567'), normalizePhone('972501234567'));
});
test('production callable requires App Check and a server-only secret', async () => {
  delete process.env.FUNCTIONS_EMULATOR;
  process.env.GCLOUD_PROJECT = 'demo-royal-icing';
  const { submitOrder } = await import('../lib/index.js');
  assert.ok(submitOrder.__endpoint.secretEnvironmentVariables.some(item => item.key === 'ORDER_HASH_KEY'));
  // Exercise the HTTP wrapper: .run() would bypass App Check middleware.
  const app = express(); app.use(express.json({ limit: '16kb' })); app.post('/submit', submitOrder);
  const server = createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: input() }) });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error.status, 'UNAUTHENTICATED');
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
