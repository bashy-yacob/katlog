import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ProductModal from '@/components/ProductModal';

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
afterEach(cleanup);
const product = { id: 'stable', name: 'קיים', description: 'תיאור', price: 120, category: 'קטגוריה היסטורית', image: '/images/home/floral-set.webp', isActive: true };

it('waits for the server, blocks duplicate submission, preserves unknown categories and form values on failure', async () => {
  let reject!: (cause: unknown) => void;
  const onSave = vi.fn().mockReturnValue(new Promise((_resolve, fail) => { reject = fail; }));
  const onClose = vi.fn();
  const view = render(<ProductModal isOpen onClose={onClose} onSave={onSave} initialProduct={product} />);
  fireEvent.change(screen.getByLabelText('שם המוצר *'), { target: { value: 'עריכה שנשמרת בטופס' } });
  const form = view.container.querySelector('form')!;
  fireEvent.submit(form); fireEvent.submit(form);
  expect(onSave).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();
  expect((screen.getByLabelText('קטגוריה') as HTMLSelectElement).value).toBe(product.category);
  fireEvent.click(screen.getByRole('button', { name: 'סגירת החלון' }));
  expect(onClose).not.toHaveBeenCalled();
  await act(async () => { reject({ code: 'unavailable' }); });
  expect(screen.getByRole('alert').textContent).toContain('החיבור');
  expect((screen.getByLabelText('שם המוצר *') as HTMLInputElement).value).toBe('עריכה שנשמרת בטופס');
  onSave.mockResolvedValue(true);
  fireEvent.submit(form);
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
});

it('keeps an image file selection failure local and does not replace the current image', () => {
  const onSave = vi.fn();
  render(<ProductModal isOpen onClose={vi.fn()} onSave={onSave} initialProduct={product} />);
  fireEvent.click(screen.getByRole('button', { name: 'העלאה מהמחשב' }));
  fireEvent.change(screen.getByLabelText('בחר תמונה מהמחשב:'), { target: { files: [new File(['<svg/>'], 'bad.svg', { type: 'image/svg+xml' })] } });
  expect(screen.getByRole('alert').textContent).toContain('5MB');
  expect((screen.getByAltText('תצוגה מקדימה של תמונת המוצר') as HTMLImageElement).getAttribute('src')).toBe(product.image);
  expect(onSave).not.toHaveBeenCalled();
});
