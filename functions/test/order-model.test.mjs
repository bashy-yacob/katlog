import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { createNewOrder, createOrderManagementPatch, decodeOrder, ORDER_STATUSES, ORDER_STATUS_LABELS } from '../lib/order-model.js';

const created = new Date('2026-01-02T10:00:00Z');
const changed = new Date('2026-01-03T10:00:00Z');
const input = { productId: 'stable-product', customerName: 'לקוחה לבדיקה', customerPhone: '+972501234567', customerEmail: '', quantity: 10, requestedPickupDate: '2026-01-10', customizationNotes: '', requestedText: '', preferredColors: '' };
const snapshot = { name: 'השם בעת הבקשה', category: 'קטגוריה קיימת', image: '/images/home/floral-set.webp' };
const record = () => createNewOrder(input, snapshot, 'RI-0123456789ABCDEF0123', created);
const management = patch => ({ status: 'pending_confirmation', quotedPrice: 120, internalNotes: 'לשימוש פנימי', priceConfirmation: { action: 'keep' }, ...patch });

test('new orders have explicit nullable prices, server-provided timestamps and an independent product snapshot', () => {
  const order = record();
  assert.equal(order.schemaVersion, 1); assert.equal(order.status, 'new'); assert.equal(order.currency, 'ILS');
  assert.equal(order.quotedPrice, null); assert.equal(order.confirmedPrice, null);
  assert.equal(order.priceConfirmedAt, null); assert.equal(order.priceConfirmedBy, null);
  assert.equal(order.createdAt, created); assert.equal(order.updatedAt, created);
  assert.notEqual(order.productSnapshot, snapshot); assert.deepEqual(order.productSnapshot, snapshot);
  assert.equal(order.fulfillmentMethod, 'pickup'); assert.equal(order.internalNotes, '');
  assert.equal(order.idempotencyKey, undefined); assert.equal(order.id, undefined);
});
test('all seven stable statuses have the expected Hebrew labels', () => {
  assert.deepEqual(ORDER_STATUSES, ['new', 'pending_confirmation', 'confirmed', 'in_progress', 'ready', 'completed', 'cancelled']);
  assert.deepEqual(ORDER_STATUSES.map(status => ORDER_STATUS_LABELS[status]), ['בקשה חדשה', 'ממתינה לאישור', 'אושרה', 'בהכנה', 'מוכנה לאיסוף', 'הושלמה', 'בוטלה']);
});
test('status and quote changes do not confirm a price or modify the original request', () => {
  const patch = createOrderManagementPatch(management({ status: 'confirmed' }), 'admin-uid', changed);
  assert.deepEqual(Object.keys(patch).sort(), ['internalNotes', 'quotedPrice', 'status', 'updatedAt']);
  assert.equal(patch.confirmedPrice, undefined); assert.equal(patch.createdAt, undefined);
  assert.equal(patch.quantity, undefined); assert.equal(patch.productSnapshot, undefined);
  assert.equal(patch.sendNotification, undefined);
});
test('confirmed price is recorded explicitly with actor and server time, independently of a later quote', () => {
  const confirmed = createOrderManagementPatch(management({ priceConfirmation: { action: 'confirm', price: 110 } }), 'admin-uid', changed);
  assert.equal(confirmed.confirmedPrice, 110); assert.equal(confirmed.quotedPrice, 120);
  assert.equal(confirmed.priceConfirmedBy, 'admin-uid'); assert.equal(confirmed.priceConfirmedAt, changed);
  const later = createOrderManagementPatch(management({ quotedPrice: 150 }), 'another-admin', new Date('2026-01-04T00:00:00Z'));
  assert.equal({ ...record(), ...confirmed, ...later }.confirmedPrice, 110);
});
test('zero is a real price, and clearing approval clears its entire metadata together', () => {
  const free = createOrderManagementPatch(management({ quotedPrice: 0, priceConfirmation: { action: 'confirm', price: 0 } }), 'admin-uid', changed);
  assert.equal(free.quotedPrice, 0); assert.equal(free.confirmedPrice, 0);
  const cleared = createOrderManagementPatch(management({ priceConfirmation: { action: 'clear' } }), 'admin-uid', changed);
  assert.equal(cleared.confirmedPrice, null); assert.equal(cleared.priceConfirmedAt, null); assert.equal(cleared.priceConfirmedBy, null);
});
test('management rejects malformed actions, invalid money, unknown fields and invalid status', () => {
  for (const price of [-1, Infinity, NaN, '120', 1000001]) {
    assert.throws(() => createOrderManagementPatch(management({ quotedPrice: price }), 'admin', changed));
    assert.throws(() => createOrderManagementPatch(management({ priceConfirmation: { action: 'confirm', price } }), 'admin', changed));
  }
  for (const patch of [{ status: 'invented' }, { internalNotes: 'x'.repeat(5001) }, { quantity: 1 }, { createdAt: changed }, { priceConfirmation: { action: 'keep', price: 120 } }, { priceConfirmation: { action: 'confirm', price: null } }, { priceConfirmation: { action: 'automatic' } }]) {
    assert.throws(() => createOrderManagementPatch(management(patch), 'admin', changed));
  }
});
test('legacy stage-3 records are decoded without backfilling or inferring price agreement from status', () => {
  const legacy = record();
  for (const key of ['schemaVersion', 'currency', 'confirmedPrice', 'priceConfirmedAt', 'priceConfirmedBy']) delete legacy[key];
  legacy.status = 'confirmed'; legacy.quotedPrice = 120;
  const originalKeys = Object.keys(legacy);
  const order = decodeOrder('authoritative-id', { ...legacy, id: 'untrusted-field' }, value => value);
  assert.equal(order.id, 'authoritative-id'); assert.equal(order.status, 'confirmed');
  assert.equal(order.confirmedPrice, null); assert.equal(order.priceConfirmedAt, null); assert.equal(order.currency, 'ILS');
  assert.deepEqual(Object.keys(legacy), originalKeys);
  assert.notEqual(order.createdAt, created); assert.equal(order.createdAt.getTime(), created.getTime());
});
test('decoding rejects corrupt dates, unsupported schemas, inconsistent approval and invalid status', () => {
  for (const patch of [{ schemaVersion: 2 }, { currency: 'USD' }, { fulfillmentMethod: 'shipping' }, { status: 'unknown' }, { confirmedPrice: 120 }, { priceConfirmedBy: 'admin' }, { quotedPrice: -1 }, { createdAt: new Date('invalid') }]) {
    assert.throws(() => decodeOrder('id', { ...record(), ...patch }, value => value));
  }
});
