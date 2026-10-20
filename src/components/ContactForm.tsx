import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { LeadValidationError, validateLeadRequest } from '../../functions/src/lead-validation';
import type { LeadFieldErrors, LeadReceipt, LeadRequestInput } from '../../functions/src/lead-validation';
import { leadError, useSubmitLead } from '@/api/leads/endpoints';
import Button from './Button';

function requestKey() {
  try {
    const previous = sessionStorage.getItem('royal-icing-contact-key');
    if (previous && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(previous)) return previous;
    const key = crypto.randomUUID(); sessionStorage.setItem('royal-icing-contact-key', key); return key;
  } catch { return crypto.randomUUID(); }
}
export default function ContactForm() {
  const { submit, ready } = useSubmitLead();
  const [idempotencyKey] = useState(requestKey);
  const [values, setValues] = useState({ name: '', phone: '', email: '', message: '' });
  const [fields, setFields] = useState<LeadFieldErrors>({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [receipt, setReceipt] = useState<LeadReceipt | null>(null);
  const original = useRef<LeadRequestInput | null>(null);
  const inFlight = useRef(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const change = (key: keyof typeof values, value: string) => {
    setValues(previous => ({ ...previous, [key]: value })); setFields(previous => ({ ...previous, [key]: undefined }));
  };
  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (inFlight.current || !ready || receipt) return;
    let input: LeadRequestInput;
    try { input = uncertain && original.current ? original.current : validateLeadRequest({ ...values, idempotencyKey }); }
    catch (cause) {
      if (cause instanceof LeadValidationError) setFields(cause.fields);
      setError('בדקי את השדות המסומנים בטופס.'); window.setTimeout(() => errorRef.current?.focus(), 0); return;
    }
    inFlight.current = true; setPending(true); setError(''); setFields({}); original.current = input;
    try {
      const result = await submit(input); setReceipt(result); setUncertain(false);
      try { if (sessionStorage.getItem('royal-icing-contact-key') === idempotencyKey) sessionStorage.removeItem('royal-icing-contact-key'); } catch { /* Receipt is acknowledged. */ }
    } catch (cause) {
      const result = leadError(cause); setError(result.message); setUncertain(result.uncertain);
      window.setTimeout(() => errorRef.current?.focus(), 0);
    } finally { inFlight.current = false; setPending(false); }
  };
  if (receipt) return <section className="contact-form" role="status" aria-live="polite"><h2>הפנייה התקבלה</h2><p>מספר הפנייה: <strong><bdi>{receipt.leadNumber}</bdi></strong></p><p>הפנייה נשמרה לעיון מנהלת העסק. אפשר לשמור את המספר לצורך בירור.</p></section>;
  const errorFor = (key: keyof typeof values) => fields[key] && <p className="form-error" id={`contact-${key}-error`}>{fields[key]}</p>;
  const attributes = (key: keyof typeof values) => ({ 'aria-invalid': !!fields[key], 'aria-describedby': fields[key] ? `contact-${key}-error` : undefined });
  return <form className="contact-form brand-form" onSubmit={event => void send(event)} aria-labelledby="contact-form-title" noValidate>
    <div className="contact-form-heading"><h2 id="contact-form-title">מה את מדמיינת?</h2><p className="form-note">השדות המסומנים בכוכבית הם שדות חובה.</p></div>
    <fieldset className="contact-fields" disabled={pending || uncertain || !ready}><div className="form-grid">
      <div className="form-group"><label htmlFor="name">שם מלא *</label><input id="name" name="name" autoComplete="name" placeholder="איך קוראים לך?" maxLength={120} required value={values.name} onChange={event => change('name', event.target.value)} {...attributes('name')} />{errorFor('name')}</div>
      <div className="form-group"><label htmlFor="phone">טלפון *</label><input id="phone" name="phone" type="tel" autoComplete="tel" dir="ltr" placeholder="מספר ליצירת קשר" maxLength={40} required value={values.phone} onChange={event => change('phone', event.target.value)} {...attributes('phone')} />{errorFor('phone')}</div>
      <div className="form-group form-group-wide"><label htmlFor="email">אימייל *</label><input id="email" name="email" type="email" autoComplete="email" dir="ltr" placeholder="כתובת המייל שלך" maxLength={254} required value={values.email} onChange={event => change('email', event.target.value)} {...attributes('email')} />{errorFor('email')}</div>
      <div className="form-group form-group-wide"><label htmlFor="message">הודעה *</label><textarea id="message" name="message" rows={5} placeholder="ספרי לנו על האירוע, הצבעים או הרעיון שלך..." maxLength={4000} required value={values.message} onChange={event => change('message', event.target.value)} {...attributes('message')} />{errorFor('message')}</div>
    </div></fieldset>
    {!ready && <p className="ui-notice" role="alert">שליחת פניות עדיין אינה זמינה. יש להשלים את חיבור שירות הפניות.</p>}
    {error && <p ref={errorRef} tabIndex={-1} className="form-error" role="alert">{error}</p>}
    {pending && <p role="status">ממתינה לאישור קליטת הפנייה...</p>}
    <div className="contact-submit"><Button type="submit" className="submit-btn" disabled={pending || !ready}>{pending ? 'שולחת...' : uncertain ? 'בדיקת קליטת הפנייה וניסיון חוזר' : 'שלח הודעה'}</Button></div>
  </form>;
}
