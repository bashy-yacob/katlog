import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProductMigration from '@/components/ProductMigration';
import { importMigration, LOCAL_PRODUCTS_KEY, parseLocalProducts, previewMigration } from '@/api/catalog/migration';
import { validateImageFile, validateProduct } from '@/api/catalog/validation';

const repository = vi.hoisted(() => ({ existingIds: vi.fn(), save: vi.fn() }));
vi.mock('@/api/catalog/endpoints', () => ({ productRepository: repository }));
const draft = { name: 'מוצר מקומי', description: 'תיאור', price: 120, image: '/images/home/floral-set.webp', category: 'ישן' };
beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); repository.existingIds.mockResolvedValue(new Set()); repository.save.mockResolvedValue(true); });
afterEach(cleanup);

it('rejects corrupted backups and marks duplicate or invalid records without silently losing data', () => {
  expect(() => parseLocalProducts('broken')).toThrow();
  expect(() => parseLocalProducts('{}')).toThrow();
  const rows = parseLocalProducts(JSON.stringify([{ ...draft, id: 'same' }, { ...draft, id: 'same' }, { ...draft, id: 'bad', price: -1 }, { ...draft, id: 'extra', unknown: true }]));
  expect(rows.every(row => row.state === 'invalid')).toBe(true);
});
it('preserves IDs and dates and skips all remote collisions', async () => {
  repository.existingIds.mockResolvedValue(new Set(['remote']));
  const rows = await previewMigration(repository as never, JSON.stringify([{ ...draft, id: 'remote' }, { ...draft, id: 'local', createdAt: '2026-01-01T00:00:00Z' }]));
  expect(rows.map(row => row.state)).toEqual(['existing', 'new']);
  const result = await importMigration(repository as never, rows, vi.fn());
  expect(result).toEqual({ imported: 1, skipped: 1, failed: 0 });
  expect(repository.save).toHaveBeenCalledWith('local', expect.objectContaining({ category: 'ישן', isActive: true }), 'import', new Date('2026-01-01T00:00:00Z'));
});
it('stops after a partial failure so a fresh preview can resume safely', async () => {
  repository.save.mockResolvedValueOnce(true).mockRejectedValueOnce(new Error('network'));
  const rows = parseLocalProducts(JSON.stringify(['a', 'b', 'c'].map(id => ({ ...draft, id }))));
  const progress = vi.fn();
  expect(await importMigration(repository as never, rows, progress)).toEqual({ imported: 1, skipped: 0, failed: 1 });
  expect(repository.save).toHaveBeenCalledTimes(2);
  expect(progress).toHaveBeenLastCalledWith('b', 'failed');
});
it('requires preview, backup and confirmation before writing, and preserves local data', async () => {
  const raw = JSON.stringify([{ ...draft, id: 'local' }]);
  localStorage.setItem(LOCAL_PRODUCTS_KEY, raw);
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  const client = new QueryClient();
  render(<QueryClientProvider client={client}><ProductMigration /></QueryClientProvider>);
  fireEvent.click(screen.getByText('העברת מוצרים מהדפדפן או מקובץ גיבוי'));
  fireEvent.click(screen.getByRole('button', { name: 'תצוגה מקדימה של מוצרים מקומיים' }));
  await waitFor(() => expect(screen.getByText(/מוצרים חדשים להעברה/)).toBeTruthy());
  const transfer = screen.getByRole('button', { name: 'העברת המוצרים החדשים בלבד' }) as HTMLButtonElement;
  expect(transfer.disabled).toBe(true); expect(repository.save).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'הורדת גיבוי לפני ההעברה' }));
  fireEvent.click(screen.getByRole('checkbox'));
  await act(async () => { fireEvent.click(transfer); });
  expect(repository.save).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem(LOCAL_PRODUCTS_KEY)).toBe(raw);
  client.clear();
});
it('validates file limits, prices and unsafe URL schemes', () => {
  expect(() => validateImageFile({ type: 'image/png', size: 5 * 1024 * 1024 + 1 })).toThrow();
  expect(() => validateImageFile({ type: 'image/svg+xml', size: 100 })).toThrow();
  expect(() => validateProduct({ ...draft, isActive: true, image: 'javascript:alert(1)' })).toThrow();
  expect(() => validateProduct({ ...draft, isActive: true, price: NaN })).toThrow();
  expect(validateProduct({ ...draft, isActive: false, price: 0 }).price).toBe(0);
});
