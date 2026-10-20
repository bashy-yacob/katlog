import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { OrderEditor } from '@/pages/admin/AdminOrdersPage';
import type { ManagedOrder } from '@/api/orders/management';
import { createNewOrder } from '../../functions/src/order-model';

const api = vi.hoisted(() => ({ update: vi.fn(), list: vi.fn() }));
vi.mock('@/api/orders/management', () => ({ createOrderRepository: () => api, managementError: (error: Error) => error.message }));
vi.mock('@/config/firebase', () => ({ db: {}, auth: { currentUser: { uid: 'admin' } } }));
vi.mock('@/hooks', () => ({ useDocumentTitle: vi.fn() }));
const entry: ManagedOrder = { revision: '1:1', order: { id: 'test', ...createNewOrder({ productId: 'product', customerName: 'לקוחה', customerPhone: '0501234567', customerEmail: '', quantity: 10, requestedPickupDate: '2026-12-31', customizationNotes: 'התאמה', requestedText: 'מזל טוב', preferredColors: 'ורוד' }, { name: 'מוצר', category: '', image: '' }, 'RI-TEST', new Date()) } };
beforeEach(() => {
  vi.clearAllMocks();
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
afterEach(cleanup);
it('waits for acknowledgement, blocks duplicate saves and keeps approval explicit', async () => {
  let resolve!: () => void;
  api.update.mockReturnValue(new Promise<void>(done => { resolve = done; }));
  const saved = vi.fn(), close = vi.fn();
  const view = render(<OrderEditor entry={entry} onSaved={saved} onClose={close} />);
  fireEvent.change(screen.getByLabelText('סטטוס'), { target: { value: 'confirmed' } });
  fireEvent.submit(view.container.querySelector('form')!); fireEvent.submit(view.container.querySelector('form')!);
  expect(api.update).toHaveBeenCalledTimes(1);
  expect(api.update.mock.calls[0][1].priceConfirmation).toEqual({ action: 'keep' });
  expect(saved).not.toHaveBeenCalled();
  fireEvent.click(screen.getAllByRole('button', { name: 'סגירה' })[0]); expect(close).not.toHaveBeenCalled();
  await act(async () => resolve()); expect(saved).toHaveBeenCalledTimes(1);
});
it('retains entered notes and price when saving fails', async () => {
  api.update.mockRejectedValue(new Error('ההזמנה השתנתה בחלון אחר'));
  const saved = vi.fn();
  const view = render(<OrderEditor entry={entry} onSaved={saved} onClose={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('הערות פנימיות'), { target: { value: 'לא לאבד' } });
  fireEvent.change(screen.getByLabelText('הצעת מחיר כוללת (₪)'), { target: { value: '200' } });
  fireEvent.submit(view.container.querySelector('form')!);
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('השתנתה'));
  expect((screen.getByLabelText('הערות פנימיות') as HTMLTextAreaElement).value).toBe('לא לאבד');
  expect((screen.getByLabelText('הצעת מחיר כוללת (₪)') as HTMLInputElement).value).toBe('200');
  expect(saved).not.toHaveBeenCalled();
});
it('sends explicit zero price confirmation and separate quote', async () => {
  api.update.mockResolvedValue(undefined);
  const view = render(<OrderEditor entry={entry} onSaved={vi.fn()} onClose={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('אישור מחיר'), { target: { value: 'confirm' } });
  fireEvent.change(screen.getByLabelText('מחיר כולל מאושר (₪)'), { target: { value: '0' } });
  fireEvent.submit(view.container.querySelector('form')!);
  await waitFor(() => expect(api.update).toHaveBeenCalled());
  expect(api.update.mock.calls[0][1]).toMatchObject({ quotedPrice: null, priceConfirmation: { action: 'confirm', price: 0 } });
});
