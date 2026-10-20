import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { OrderValidationError, pickupToday, validateOrderRequest } from '../../functions/src/order-validation';
import type { OrderFieldErrors, OrderReceipt, OrderRequestInput } from '../../functions/src/order-validation';
import { orderError, useSubmitOrder } from '@/api/orders/endpoints';
import Button from './Button';

function requestKey(productId: string) {
  const storageKey = `royal-icing-order-key:${productId}`;
  try {
    const old = sessionStorage.getItem(storageKey);
    if (old && /^[0-9a-f-]{36}$/.test(old)) return old;
    const value = crypto.randomUUID(); sessionStorage.setItem(storageKey, value); return value;
  } catch { return crypto.randomUUID(); }
}
export default function OrderRequestForm({ product }: { product: { id: string; name: string } }) {
  const { submit, ready } = useSubmitOrder();
  const [idempotencyKey] = useState(() => requestKey(product.id));
  const [values, setValues] = useState({ customerName: '', customerPhone: '', customerEmail: '', quantity: '10', requestedPickupDate: '', customizationNotes: '', requestedText: '', preferredColors: '' });
  const [fields, setFields] = useState<OrderFieldErrors>({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const inFlight = useRef(false);
  const original = useRef<OrderRequestInput | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const change = (name: keyof typeof values, value: string) => {
    setValues(previous => ({ ...previous, [name]: value }));
    setFields(previous => ({ ...previous, [name]: undefined }));
  };
  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (inFlight.current || !ready || receipt) return;
    let input: OrderRequestInput;
    try {
      input = uncertain && original.current ? original.current : validateOrderRequest({ ...values, quantity: Number(values.quantity), productId: product.id, idempotencyKey });
    } catch (cause) {
      if (cause instanceof OrderValidationError) setFields(cause.fields);
      setError('בדקי את השדות המסומנים בטופס.');
      window.setTimeout(() => errorRef.current?.focus(), 0); return;
    }
    inFlight.current = true; setPending(true); setError(''); setFields({}); original.current = input;
    try {
      const saved = await submit(input);
      setReceipt(saved); setUncertain(false);
      try {
        const key = `royal-icing-order-key:${product.id}`;
        if (sessionStorage.getItem(key) === idempotencyKey) sessionStorage.removeItem(key);
      } catch { /* The receipt is already confirmed by the server. */ }
    } catch (cause) {
      const result = orderError(cause); setError(result.message); setUncertain(result.uncertain);
      window.setTimeout(() => errorRef.current?.focus(), 0);
    } finally { inFlight.current = false; setPending(false); }
  };
  if (receipt) return <section className="order-receipt" role="status" aria-live="polite">
    <h2>בקשתך התקבלה לבדיקה</h2>
    <p>מספר הבקשה שלך: <strong><bdi>{receipt.orderNumber}</bdi></strong></p>
    <p>שמרי את המספר לצורך בירור. מנהלת העסק תבדוק את הפרטים ותתאם איתך את המחיר הסופי ואת האיסוף.</p>
    <p className="ui-notice">זהו אישור קבלת בקשה בלבד. ההזמנה טרם אושרה ולא בוצע תשלום.</p>
    <Link className="brand-button primary" to="/catalog">חזרה לקטלוג</Link>
  </section>;
  const described = (field: keyof typeof values) => fields[field] ? `${field}-error` : undefined;
  const fieldError = (field: keyof typeof values) => fields[field] && <p id={`${field}-error`} className="form-note order-field-error">{fields[field]}</p>;
  return <form className="brand-form order-request-form" onSubmit={event => void send(event)} noValidate>
    <h2>פרטי הבקשה שלך</h2>
    <p>המוצר שנבחר: <strong>{product.name}</strong></p>
    <p className="ui-notice" id="order-terms">מינימום 10 עוגיות. איסוף עצמי בלבד, במיקום שיתואם עם העסק. המחיר הסופי ייקבע לאחר בדיקת הבקשה. שליחה אינה אישור הזמנה או תשלום.</p>
    {!ready && <p className="form-error" role="alert">שליחת בקשות ההזמנה עדיין אינה זמינה. יש להשלים את חיבור שירות ההזמנות.</p>}
    <p className="form-note">השדות המסומנים בכוכבית הם שדות חובה.</p>
    <fieldset disabled={pending || uncertain || !ready} className="order-fields"><div className="form-grid">
      <div className="form-group"><label htmlFor="customerName">שם מלא *</label><input id="customerName" autoComplete="name" value={values.customerName} maxLength={120} required aria-invalid={!!fields.customerName} aria-describedby={described('customerName')} onChange={event => change('customerName', event.target.value)} />{fieldError('customerName')}</div>
      <div className="form-group"><label htmlFor="customerPhone">טלפון *</label><input id="customerPhone" type="tel" autoComplete="tel" dir="ltr" value={values.customerPhone} maxLength={40} required aria-invalid={!!fields.customerPhone} aria-describedby={described('customerPhone')} onChange={event => change('customerPhone', event.target.value)} />{fieldError('customerPhone')}</div>
      <div className="form-group"><label htmlFor="customerEmail">אימייל (לא חובה)</label><input id="customerEmail" type="email" autoComplete="email" dir="ltr" value={values.customerEmail} maxLength={254} aria-invalid={!!fields.customerEmail} aria-describedby={described('customerEmail')} onChange={event => change('customerEmail', event.target.value)} />{fieldError('customerEmail')}</div>
      <div className="form-group"><label htmlFor="quantity">כמות עוגיות *</label><input id="quantity" type="number" min={10} step={1} inputMode="numeric" value={values.quantity} required aria-invalid={!!fields.quantity} aria-describedby={described('quantity')} onChange={event => change('quantity', event.target.value)} />{fieldError('quantity')}</div>
      <div className="form-group form-group-wide"><label htmlFor="requestedPickupDate">תאריך איסוף מבוקש *</label><input id="requestedPickupDate" type="date" min={pickupToday()} value={values.requestedPickupDate} required aria-invalid={!!fields.requestedPickupDate} aria-describedby={described('requestedPickupDate')} onChange={event => change('requestedPickupDate', event.target.value)} />{fieldError('requestedPickupDate')}</div>
      <div className="form-group form-group-wide"><label htmlFor="requestedText">כיתוב מבוקש על העוגיות (לא חובה)</label><input id="requestedText" value={values.requestedText} maxLength={250} aria-invalid={!!fields.requestedText} aria-describedby={described('requestedText')} onChange={event => change('requestedText', event.target.value)} />{fieldError('requestedText')}</div>
      <div className="form-group form-group-wide"><label htmlFor="preferredColors">צבעים או סגנון מועדפים (לא חובה)</label><textarea id="preferredColors" value={values.preferredColors} maxLength={500} rows={2} aria-invalid={!!fields.preferredColors} aria-describedby={described('preferredColors')} onChange={event => change('preferredColors', event.target.value)} />{fieldError('preferredColors')}</div>
      <div className="form-group form-group-wide"><label htmlFor="customizationNotes">הערות (לא חובה)</label><textarea id="customizationNotes" value={values.customizationNotes} maxLength={2000} rows={4} aria-invalid={!!fields.customizationNotes} aria-describedby={described('customizationNotes')} onChange={event => change('customizationNotes', event.target.value)} />{fieldError('customizationNotes')}</div>
    </div></fieldset>
    {error && <p ref={errorRef} tabIndex={-1} className="form-error" role="alert">{error}</p>}
    {pending && <p role="status">ממתינה לאישור קליטת הבקשה...</p>}
    <Button type="submit" disabled={pending || !ready} aria-describedby="order-terms">{pending ? 'שולחת בקשה...' : uncertain ? 'בדיקת קליטת הבקשה וניסיון חוזר' : 'שליחת בקשת הזמנה'}</Button>
  </form>;
}
