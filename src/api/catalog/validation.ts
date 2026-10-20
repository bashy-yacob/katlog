import type { ProductInput } from '../../types/index.ts';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function validateImageFile(file: { size: number; type: string }) {
  if (!IMAGE_TYPES.includes(file.type) || file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    throw new Error('בחרי תמונת JPEG, PNG, WebP או GIF בגודל עד 5MB.');
  }
}

export function validImageUrl(value: string, allowEmulator = import.meta.env?.DEV === true) {
  if (!value) return true;
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return value.length <= 2048;
  try { const url = new URL(value); return (url.protocol === 'https:' || (allowEmulator && url.origin === 'http://127.0.0.1:9199')) && !url.username && !url.password && value.length <= 2048; }
  catch { return false; }
}

export function validateProduct(input: ProductInput, allowDataImage = false, allowEmulator = import.meta.env?.DEV === true): ProductInput {
  if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 200
    || typeof input.description !== 'string' || input.description.length > 5000
    || typeof input.price !== 'number' || !Number.isFinite(input.price) || input.price < 0 || input.price > 1000000
    || typeof input.isActive !== 'boolean'
    || (input.category !== undefined && (typeof input.category !== 'string' || input.category.length > 100))) {
    throw new Error('בדקי את שם המוצר, המחיר והפרטים שהוזנו.');
  }
  const image = input.image ?? '';
  if (typeof image !== 'string' || (!validImageUrl(image, allowEmulator) && !(allowDataImage && /^data:image\/(jpeg|png|webp|gif);base64,/.test(image)))) {
    throw new Error('קישור התמונה אינו תקין. השתמשי בקישור HTTPS או העלי קובץ תמונה נתמך.');
  }
  return { name: input.name, description: input.description, price: input.price, isActive: input.isActive, category: input.category ?? '', image };
}

export function catalogError(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : '';
  if (code === 'permission-denied' || code === 'storage/unauthorized') return 'אין הרשאה לפעולה. בדקי שההתחברות והרשאות הניהול עדיין בתוקף.';
  if (code === 'unavailable' || code === 'storage/retry-limit-exceeded') return 'לא הצלחנו להתחבר לשירות. בדקי את החיבור ונסי שוב.';
  return 'לא הצלחנו להשלים את הפעולה. הפרטים נשמרו, ואפשר לנסות שוב.';
}
