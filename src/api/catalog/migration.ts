import type { ProductInput } from '../../types/index.ts';
import type { createProductRepository } from './repository.ts';
import { validateProduct } from './validation.ts';
import { decodeDataImage } from './images.ts';

export const LOCAL_PRODUCTS_KEY = 'royal-icing-products';
type Repository = ReturnType<typeof createProductRepository>;
export interface ImportRow {
  id: string;
  name: string;
  input?: ProductInput;
  createdAt?: Date;
  state: 'new' | 'existing' | 'invalid';
  reason?: string;
}

export function parseLocalProducts(raw: string): ImportRow[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('הגיבוי צריך להכיל רשימת מוצרים.');
  const counts = new Map<string, number>();
  for (const value of parsed) if (typeof value?.id === 'string') counts.set(value.id, (counts.get(value.id) ?? 0) + 1);
  return parsed.map((value): ImportRow => {
    const id = typeof value?.id === 'string' ? value.id : '';
    const name = typeof value?.name === 'string' ? value.name : 'מוצר ללא שם';
    try {
      if (!value || typeof value !== 'object' || Array.isArray(value) || !id || id === '.' || id === '..' || id.includes('/') || new TextEncoder().encode(id).length > 1500 || counts.get(id) !== 1) throw new Error('מזהה חסר, כפול או לא תקין.');
      const allowed = ['id', 'name', 'description', 'price', 'image', 'category', 'isActive', 'createdAt', 'updatedAt'];
      if (Object.keys(value).some(key => !allowed.includes(key))) throw new Error('נמצאו שדות לא מוכרים. נדרשת בדיקה לפני העברה.');
      const input = validateProduct({ name: value.name, description: value.description ?? '', price: value.price, image: value.image, category: value.category, isActive: value.isActive ?? true }, true);
      if (input.image?.startsWith('data:')) decodeDataImage(input.image);
      const createdAt = value.createdAt === undefined ? undefined : new Date(value.createdAt);
      if (createdAt && (!Number.isFinite(createdAt.getTime()) || createdAt.getTime() > Date.now())) throw new Error('תאריך היצירה אינו תקין.');
      return { id, name, input, createdAt, state: 'new' };
    } catch (error) {
      return { id, name, state: 'invalid', reason: error instanceof Error ? error.message : 'נתוני המוצר אינם תקינים.' };
    }
  });
}

export async function previewMigration(repository: Repository, raw: string) {
  const rows = parseLocalProducts(raw);
  // The unfiltered admin list also detects collisions with legacy records.
  const existing = await repository.existingIds();
  return rows.map(row => row.state === 'new' && existing.has(row.id) ? { ...row, state: 'existing' as const } : row);
}

export async function importMigration(repository: Repository, rows: ImportRow[], onProgress: (id: string, state: 'imported' | 'skipped' | 'failed') => void) {
  const result = { imported: 0, skipped: 0, failed: 0 };
  for (const row of rows) {
    if (row.state !== 'new' || !row.input) { result.skipped++; continue; }
    try {
      const created = await repository.save(row.id, row.input, 'import', row.createdAt);
      if (created) { result.imported++; onProgress(row.id, 'imported'); }
      else { result.skipped++; onProgress(row.id, 'skipped'); }
    } catch { result.failed++; onProgress(row.id, 'failed'); break; }
  }
  return result;
}
