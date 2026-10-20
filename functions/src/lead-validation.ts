import { normalizePhone } from './order-validation.ts';

export interface LeadRequestInput { idempotencyKey: string; name: string; phone: string; email: string; message: string }
export interface LeadReceipt { leadNumber: string }
export type LeadFieldErrors = Partial<Record<keyof LeadRequestInput, string>>;
export const LEAD_STATUSES = ['new', 'contacted', 'completed'] as const;
export type LeadStatus = typeof LEAD_STATUSES[number];
export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === 'string' && (LEAD_STATUSES as readonly string[]).includes(value);
}
export class LeadValidationError extends Error {
  public fields: LeadFieldErrors;
  constructor(fields: LeadFieldErrors) { super('בדקי את השדות המסומנים בטופס.'); this.fields = fields; }
}
export function validateLeadRequest(raw: unknown): LeadRequestInput {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new LeadValidationError({ name: 'הפנייה אינה תקינה.' });
  const source = raw as Record<string, unknown>;
  const limits = { idempotencyKey: 36, name: 120, phone: 40, email: 254, message: 4000 };
  const allowed = new Set(Object.keys(limits));
  if (Object.keys(source).some(key => !allowed.has(key))) throw new LeadValidationError({ message: 'הפנייה כוללת שדות שאינם מותרים.' });
  const fields: LeadFieldErrors = {};
  const text = (key: keyof typeof limits) => {
    const value = source[key];
    if (typeof value !== 'string' || !value.trim() || value.length > limits[key] || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)) {
      fields[key] = `יש למלא את השדה, עד ${limits[key]} תווים.`; return '';
    }
    return value.trim();
  };
  const idempotencyKey = text('idempotencyKey').toLowerCase();
  const name = text('name'), rawPhone = text('phone'), email = text('email').toLowerCase(), message = text('message');
  const phone = normalizePhone(rawPhone);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(idempotencyKey)) fields.idempotencyKey = 'יש לרענן את הטופס ולנסות שוב.';
  if (name.length < 2) fields.name = 'יש להזין שם מלא.';
  if (!/^[+\d ()-]+$/.test(rawPhone) || !/^\+?\d{7,15}$/.test(phone)) fields.phone = 'יש להזין מספר טלפון תקין.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fields.email = 'כתובת האימייל אינה תקינה.';
  if (Object.keys(fields).length) throw new LeadValidationError(fields);
  return { idempotencyKey, name, phone, email, message };
}
