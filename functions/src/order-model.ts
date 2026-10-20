import type { OrderRequestInput } from './order-validation.js';

// This module is shared with the browser and must not import any SDK or secret.
export const ORDER_STATUSES = ['new', 'pending_confirmation', 'confirmed', 'in_progress', 'ready', 'completed', 'cancelled'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'בקשה חדשה', pending_confirmation: 'ממתינה לאישור', confirmed: 'אושרה',
  in_progress: 'בהכנה', ready: 'מוכנה לאיסוף', completed: 'הושלמה', cancelled: 'בוטלה',
};
export interface OrderProductSnapshot { name: string; category: string; image: string }
export interface OrderDocument<TDate> extends Omit<OrderRequestInput, 'idempotencyKey'> {
  schemaVersion: 1;
  orderNumber: string;
  productSnapshot: OrderProductSnapshot;
  status: OrderStatus;
  currency: 'ILS';
  quotedPrice: number | null;
  confirmedPrice: number | null;
  priceConfirmedAt: TDate | null;
  priceConfirmedBy: string | null;
  internalNotes: string;
  fulfillmentMethod: 'pickup';
  createdAt: TDate;
  updatedAt: TDate;
}
export interface Order<TDate = Date> extends OrderDocument<TDate> { id: string }
export type PriceConfirmation = { action: 'keep' } | { action: 'confirm'; price: number } | { action: 'clear' };
export interface OrderManagementInput {
  status: OrderStatus;
  quotedPrice: number | null;
  internalNotes: string;
  priceConfirmation: PriceConfirmation;
}
export interface OrderManagementPatch<TDate> {
  status: OrderStatus;
  quotedPrice: number | null;
  internalNotes: string;
  updatedAt: TDate;
  confirmedPrice?: number | null;
  priceConfirmedAt?: TDate | null;
  priceConfirmedBy?: string | null;
}

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && (ORDER_STATUSES as readonly string[]).includes(value);
}
export function isOrderPrice(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1_000_000);
}
function text(value: unknown, max: number, required = false): string {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new Error('נתוני ההזמנה אינם תקינים.');
  return value;
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('נתוני ההזמנה אינם תקינים.');
  return value as Record<string, unknown>;
}
function quantity(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 10) throw new Error('כמות ההזמנה אינה תקינה.');
  return value;
}
function pickupDate(value: unknown): string {
  const date = text(value, 10, true);
  const parsed = new Date(`${date}T00:00:00Z`);
  // Existing orders can have past pickup dates. Do not reapply the new-request window.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new Error('תאריך ההזמנה אינו תקין.');
  return date;
}
export function orderProductSnapshot(raw: unknown): OrderProductSnapshot {
  const value = object(raw);
  return { name: text(value.name, 200, true), category: text(value.category ?? '', 100), image: text(value.image ?? '', 2048) };
}
function contactAndRequest(raw: Record<string, unknown>): Omit<OrderRequestInput, 'idempotencyKey'> {
  return {
    productId: text(raw.productId, 1500, true), customerName: text(raw.customerName, 120, true),
    customerPhone: text(raw.customerPhone, 40, true), customerEmail: text(raw.customerEmail ?? '', 254),
    quantity: quantity(raw.quantity), requestedPickupDate: pickupDate(raw.requestedPickupDate),
    customizationNotes: text(raw.customizationNotes ?? '', 2000), requestedText: text(raw.requestedText ?? '', 250),
    preferredColors: text(raw.preferredColors ?? '', 500),
  };
}

export function createNewOrder<TDate>(input: Omit<OrderRequestInput, 'idempotencyKey'>, snapshot: OrderProductSnapshot, orderNumber: string, serverTime: TDate): OrderDocument<TDate> {
  return {
    ...contactAndRequest(input as unknown as Record<string, unknown>),
    schemaVersion: 1, orderNumber: text(orderNumber, 100, true), productSnapshot: orderProductSnapshot(snapshot),
    status: 'new', currency: 'ILS', quotedPrice: null, confirmedPrice: null,
    priceConfirmedAt: null, priceConfirmedBy: null, internalNotes: '', fulfillmentMethod: 'pickup',
    createdAt: serverTime, updatedAt: serverTime,
  };
}

// Read compatibility is in memory only: never write a decoded legacy order back
// as a complete replacement. Management uses a narrow update patch instead.
export function decodeOrder(id: string, raw: unknown, readDate: (value: unknown) => Date): Order<Date> {
  const value = object(raw);
  if ((value.schemaVersion ?? 1) !== 1 || (value.currency ?? 'ILS') !== 'ILS' || (value.fulfillmentMethod ?? 'pickup') !== 'pickup'
    || !isOrderStatus(value.status) || !isOrderPrice(value.quotedPrice ?? null) || !isOrderPrice(value.confirmedPrice ?? null)) throw new Error('מבנה ההזמנה אינו נתמך.');
  const date = (stamp: unknown) => {
    const result = readDate(stamp);
    if (!(result instanceof Date) || !Number.isFinite(result.getTime())) throw new Error('תאריך ההזמנה אינו תקין.');
    return new Date(result.getTime());
  };
  const confirmedPrice = value.confirmedPrice ?? null;
  const priceConfirmedBy = value.priceConfirmedBy ?? null;
  const priceConfirmedAt = value.priceConfirmedAt ?? null;
  if (confirmedPrice === null && (priceConfirmedBy !== null || priceConfirmedAt !== null)) throw new Error('תיעוד אישור המחיר אינו תקין.');
  if (confirmedPrice !== null && (priceConfirmedAt === null || priceConfirmedBy === null)) throw new Error('חסר תיעוד אישור המחיר.');
  return {
    ...contactAndRequest(value), id: text(id, 1500, true), schemaVersion: 1,
    orderNumber: text(value.orderNumber, 100, true), productSnapshot: orderProductSnapshot(value.productSnapshot),
    status: value.status, currency: 'ILS', fulfillmentMethod: 'pickup',
    quotedPrice: (value.quotedPrice ?? null) as number | null, confirmedPrice: confirmedPrice as number | null,
    priceConfirmedBy: priceConfirmedBy === null ? null : text(priceConfirmedBy, 128, true),
    priceConfirmedAt: priceConfirmedAt === null ? null : date(priceConfirmedAt),
    internalNotes: text(value.internalNotes ?? '', 5000), createdAt: date(value.createdAt), updatedAt: date(value.updatedAt),
  };
}

export function createOrderManagementPatch<TDate>(input: OrderManagementInput, actorUid: string, serverTime: TDate): OrderManagementPatch<TDate> {
  if (Object.keys(input).some(key => !['status', 'quotedPrice', 'internalNotes', 'priceConfirmation'].includes(key))
    || !isOrderStatus(input.status) || !isOrderPrice(input.quotedPrice)) throw new Error('פרטי עדכון ההזמנה אינם תקינים.');
  const actor = text(actorUid, 128, true);
  const patch: OrderManagementPatch<TDate> = {
    status: input.status, quotedPrice: input.quotedPrice, internalNotes: text(input.internalNotes, 5000), updatedAt: serverTime,
  };
  const confirmation = object(input.priceConfirmation);
  const action = confirmation.action;
  if (action === 'keep' || action === 'clear') {
    if (Object.keys(confirmation).some(key => key !== 'action')) throw new Error('פעולת אישור המחיר אינה תקינה.');
    if (action === 'clear') Object.assign(patch, { confirmedPrice: null, priceConfirmedAt: null, priceConfirmedBy: null });
  } else if (action === 'confirm') {
    if (Object.keys(confirmation).some(key => !['action', 'price'].includes(key)) || confirmation.price === null || !isOrderPrice(confirmation.price)) throw new Error('המחיר שאושר אינו תקין.');
    Object.assign(patch, { confirmedPrice: confirmation.price, priceConfirmedAt: serverTime, priceConfirmedBy: actor });
  } else throw new Error('יש לבחור במפורש אם לשמור, לאשר או לבטל את אישור המחיר.');
  return patch;
}
