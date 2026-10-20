import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import OrderRequestForm from '@/components/OrderRequestForm';
import OrderRequestPage from '@/pages/OrderRequestPage';

const api = vi.hoisted(() => ({ submit: vi.fn(), ready: true }));
const productState = vi.hoisted(() => ({ product: { id: 'test-product', name: 'מוצר נבחר לבדיקה', description: '', price: 120, isActive: true }, isLoading: false, error: null as unknown, retry: vi.fn() }));
vi.mock('@/hooks', () => ({ useDocumentTitle: vi.fn() }));
vi.mock('@/hooks/useProducts', () => ({ useProduct: () => productState }));
vi.mock('@/api/orders/endpoints', async importOriginal => {
  const original = await importOriginal<typeof import('@/api/orders/endpoints')>();
  return { ...original, useSubmitOrder: () => api };
});
const product = { id: 'test-product', name: 'מוצר נבחר לבדיקה' };
function mount() { return render(<MemoryRouter><OrderRequestForm product={product} /></MemoryRouter>); }
function fill() {
  fireEvent.change(screen.getByLabelText('שם מלא *'), { target: { value: 'לקוחה לבדיקה' } });
  fireEvent.change(screen.getByLabelText('טלפון *'), { target: { value: '0501234567' } });
  const future = new Date(); future.setUTCDate(future.getUTCDate() + 2);
  fireEvent.change(screen.getByLabelText('תאריך איסוף מבוקש *'), { target: { value: future.toISOString().slice(0, 10) } });
}
beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); api.ready = true; productState.error = null; productState.product.isActive = true; });
afterEach(cleanup);
it('shows the product and pickup/pricing terms without requiring email, login, payment, shipping or an inspiration upload', () => {
  mount();
  expect(screen.getByText(product.name)).toBeTruthy();
  expect(screen.getByText(/איסוף עצמי בלבד/)).toBeTruthy();
  expect(screen.getByLabelText('אימייל (לא חובה)').hasAttribute('required')).toBe(false);
  expect(screen.queryByLabelText(/משלוח/)).toBeNull();
  expect(document.querySelector('input[type=file]')).toBeNull();
});
it('rejects a quantity below ten before sending any request', async () => {
  const view = mount(); fill();
  fireEvent.change(screen.getByLabelText('כמות עוגיות *'), { target: { value: '9' } });
  fireEvent.submit(view.container.querySelector('form')!);
  expect(api.submit).not.toHaveBeenCalled();
  expect(screen.getByText(/מינימום ההזמנה הוא 10/)).toBeTruthy();
});
it('prevents duplicate submission and waits for the server before showing a receipt', async () => {
  let resolve!: (value: unknown) => void;
  api.submit.mockReturnValue(new Promise(done => { resolve = done; }));
  const view = mount(); fill();
  const form = view.container.querySelector('form')!;
  fireEvent.submit(form); fireEvent.submit(form);
  expect(api.submit).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('בקשתך התקבלה לבדיקה')).toBeNull();
  await act(async () => { resolve({ orderNumber: 'RI-0123456789ABCDEF0123' }); });
  expect(screen.getByText('בקשתך התקבלה לבדיקה')).toBeTruthy();
  expect(screen.getByText(/ההזמנה טרם אושרה ולא בוצע תשלום/)).toBeTruthy();
  expect(sessionStorage.getItem('royal-icing-order-key:test-product')).toBeNull();
});
it('keeps input and the exact same request identity when an acknowledgement is lost', async () => {
  api.submit.mockRejectedValueOnce({ code: 'functions/unavailable' }).mockResolvedValueOnce({ orderNumber: 'RI-0123456789ABCDEF0123' });
  const view = mount(); fill();
  fireEvent.submit(view.container.querySelector('form')!);
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('ייתכן שהיא נשמרה'));
  expect((screen.getByLabelText('שם מלא *') as HTMLInputElement).value).toBe('לקוחה לבדיקה');
  fireEvent.click(screen.getByRole('button', { name: 'בדיקת קליטת הבקשה וניסיון חוזר' }));
  await waitFor(() => expect(screen.getByText('בקשתך התקבלה לבדיקה')).toBeTruthy());
  expect(api.submit.mock.calls[0][0]).toEqual(api.submit.mock.calls[1][0]);
});
it('shows rate limiting without clearing input or inventing success', async () => {
  api.submit.mockRejectedValue({ code: 'functions/resource-exhausted' });
  const view = mount(); fill(); fireEvent.submit(view.container.querySelector('form')!);
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('בקשות רבות מדי'));
  expect(screen.queryByText('בקשתך התקבלה לבדיקה')).toBeNull();
  expect((screen.getByLabelText('טלפון *') as HTMLInputElement).value).toBe('0501234567');
});
it('does not submit when the order service is not configured', () => {
  api.ready = false; const view = mount();
  fireEvent.submit(view.container.querySelector('form')!);
  expect(api.submit).not.toHaveBeenCalled();
  expect(screen.getByRole('alert').textContent).toContain('עדיין אינה זמינה');
});
it('keeps form input when a later product refresh fails', async () => {
  const tree = <MemoryRouter initialEntries={['/catalog/test-product/order']}><Routes><Route path="/catalog/:id/order" element={<OrderRequestPage />} /></Routes></MemoryRouter>;
  const view = render(tree);
  await waitFor(() => expect(screen.getByLabelText('שם מלא *')).toBeTruthy());
  fireEvent.change(screen.getByLabelText('שם מלא *'), { target: { value: 'פרטים שנשמרים' } });
  productState.error = { code: 'unavailable' };
  view.rerender(<MemoryRouter initialEntries={['/catalog/test-product/order']}><Routes><Route path="/catalog/:id/order" element={<OrderRequestPage />} /></Routes></MemoryRouter>);
  expect((screen.getByLabelText('שם מלא *') as HTMLInputElement).value).toBe('פרטים שנשמרים');
  expect(screen.getByText(/הפרטים שמילאת נשמרו/)).toBeTruthy();
});
it('does not open a request form for an initially hidden product', () => {
  productState.product.isActive = false;
  render(<MemoryRouter initialEntries={['/catalog/test-product/order']}><Routes><Route path="/catalog/:id/order" element={<OrderRequestPage />} /></Routes></MemoryRouter>);
  expect(screen.getByText('המוצר אינו זמין להזמנה')).toBeTruthy();
  expect(screen.queryByLabelText('שם מלא *')).toBeNull();
});
