import { expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { orderFromFirestore } from '@/api/orders/serialization';

const time = Timestamp.fromDate(new Date('2026-01-01T12:00:00Z'));
const legacy = {
  orderNumber: 'RI-0123456789ABCDEF0123', productId: 'old-product', productSnapshot: { name: 'עיצוב היסטורי', image: '/original.webp', category: 'קטגוריה היסטורית' },
  customerName: 'לקוחה לבדיקה', customerPhone: '0501234567', quantity: 10, requestedPickupDate: '2026-01-02',
  status: 'completed', quotedPrice: 120, internalNotes: '', createdAt: time, updatedAt: time,
};
it('converts Firestore timestamps and preserves historical data even after the pickup date', () => {
  const order = orderFromFirestore('stable-id', legacy);
  expect(order.createdAt).toEqual(new Date('2026-01-01T12:00:00Z'));
  expect(order.requestedPickupDate).toBe('2026-01-02');
  expect(order.productSnapshot).toEqual(legacy.productSnapshot);
  expect(order.customerEmail).toBe(''); expect(order.confirmedPrice).toBeNull();
  expect(order.status).toBe('completed'); expect(order.id).toBe('stable-id');
  expect('confirmedPrice' in legacy).toBe(false);
});
it('converts the price-confirmation timestamp separately and preserves a zero agreed price', () => {
  const order = orderFromFirestore('stable-id', { ...legacy, confirmedPrice: 0, priceConfirmedAt: time, priceConfirmedBy: 'admin-uid' });
  expect(order.confirmedPrice).toBe(0); expect(order.quotedPrice).toBe(120);
  expect(order.priceConfirmedAt).toEqual(time.toDate()); expect(order.priceConfirmedBy).toBe('admin-uid');
});
it('rejects dates that were silently changed to JSON strings instead of Firestore timestamps', () => {
  expect(() => orderFromFirestore('stable-id', { ...legacy, updatedAt: '2026-01-01T12:00:00Z' })).toThrow();
});
