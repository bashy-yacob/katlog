// Shared by the browser and the server. No SDK, secret or server import belongs here.
export interface OrderRequestInput {
  idempotencyKey: string;
  productId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  quantity: number;
  requestedPickupDate: string;
  customizationNotes: string;
  requestedText: string;
  preferredColors: string;
}
export interface OrderReceipt { orderNumber: string }
export type OrderFieldErrors = Partial<Record<keyof OrderRequestInput, string>>;
export class OrderValidationError extends Error {
  public fields: OrderFieldErrors;
  constructor(fields: OrderFieldErrors) { super('בדקי את השדות המסומנים בטופס.'); this.fields = fields; }
}
export function pickupToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: string) => parts.find(item => item.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function validPickupDate(value: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && value >= pickupToday(now);
}
export function normalizePhone(value: string) {
  let phone = value.replace(/[ ()-]/g, '');
  if (phone.startsWith('00')) phone = '+' + phone.slice(2);
  if (/^0\d{8,9}$/.test(phone)) phone = '+972' + phone.slice(1);
  if (/^972\d{8,9}$/.test(phone)) phone = '+' + phone;
  return phone;
}
export function validateOrderRequest(raw: unknown, now = new Date(), checkDateWindow = true): OrderRequestInput {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new OrderValidationError({ customerName: 'הבקשה אינה תקינה.' });
  const source = raw as Record<string, unknown>;
  const fields: OrderFieldErrors = {};
  const limits = { idempotencyKey: 36, productId: 1500, customerName: 120, customerPhone: 40, customerEmail: 254, requestedPickupDate: 10, customizationNotes: 2000, requestedText: 250, preferredColors: 500 };
  const allowed = new Set([...Object.keys(limits), 'quantity']);
  if (Object.keys(source).some(key => !allowed.has(key))) throw new OrderValidationError({ productId: 'הבקשה כוללת שדות שאינם מותרים.' });
  const text = (key: keyof typeof limits, required = false) => {
    const value = source[key] ?? '';
    if (typeof value !== 'string' || value.length > limits[key] || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)) {
      fields[key] = `יש להזין טקסט באורך עד ${limits[key]} תווים.`; return '';
    }
    if (required && !value.trim()) fields[key] = 'זהו שדה חובה.';
    return key === 'productId' ? value : value.trim();
  };
  const idempotencyKey = text('idempotencyKey', true).toLowerCase();
  const productId = text('productId', true);
  const customerName = text('customerName', true);
  const phoneText = text('customerPhone', true);
  const customerPhone = normalizePhone(phoneText);
  const customerEmail = text('customerEmail').toLowerCase();
  const requestedPickupDate = text('requestedPickupDate', true);
  const customizationNotes = text('customizationNotes');
  const requestedText = text('requestedText');
  const preferredColors = text('preferredColors');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(idempotencyKey)) fields.idempotencyKey = 'יש לרענן את הטופס ולנסות שוב.';
  if (!productId.trim() || productId.includes('/') || productId === '.' || productId === '..' || new TextEncoder().encode(productId).length > 1500) fields.productId = 'יש לבחור מוצר תקין.';
  if (customerName.length < 2) fields.customerName = 'יש להזין שם מלא.';
  if (!/^[+\d ()-]+$/.test(phoneText) || !/^\+?\d{7,15}$/.test(customerPhone)) fields.customerPhone = 'יש להזין מספר טלפון תקין.';
  if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) fields.customerEmail = 'כתובת האימייל אינה תקינה.';
  const quantity = source.quantity;
  if (typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity < 10) fields.quantity = 'מינימום ההזמנה הוא 10 עוגיות, בכמות שלמה.';
  // Replays are allowed after midnight, but new requests must use a current date.
  const parsed = new Date(`${requestedPickupDate}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedPickupDate) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== requestedPickupDate || (checkDateWindow && !validPickupDate(requestedPickupDate, now))) fields.requestedPickupDate = 'יש לבחור תאריך איסוף תקין שאינו בעבר.';
  if (Object.keys(fields).length) throw new OrderValidationError(fields);
  return { idempotencyKey, productId, customerName, customerPhone, customerEmail, quantity: quantity as number, requestedPickupDate, customizationNotes, requestedText, preferredColors };
}
