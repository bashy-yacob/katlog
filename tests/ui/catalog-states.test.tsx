import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CatalogPage from '@/pages/CatalogPage';
import ProductDetailPage from '@/pages/ProductDetailPage';

const state = vi.hoisted(() => ({
  list: { products: [], isLoading: false, error: null as unknown, retry: vi.fn() },
  detail: { product: null as unknown, isLoading: false, error: null as unknown, retry: vi.fn() },
}));
vi.mock('@/hooks', () => ({ useDocumentTitle: vi.fn(), useProducts: () => state.list }));
vi.mock('@/hooks/useProducts', () => ({ useProduct: () => state.detail }));
beforeEach(() => {
  state.list.error = null; state.list.isLoading = false;
  state.detail.error = null; state.detail.product = null; state.detail.isLoading = false;
  vi.clearAllMocks();
});
afterEach(cleanup);
it('shows a loading state instead of an empty catalog during server fetch', () => {
  state.list.isLoading = true;
  render(<MemoryRouter><CatalogPage /></MemoryRouter>);
  expect(screen.getByRole('status').textContent).toContain('טוענת');
  expect(screen.queryByText('משהו מתוק מתבשל כאן...')).toBeNull();
});
it('shows a retryable network error instead of an empty catalog', () => {
  state.list.error = { code: 'unavailable' };
  render(<MemoryRouter><CatalogPage /></MemoryRouter>);
  expect(screen.getByRole('alert').textContent).toContain('החיבור');
  fireEvent.click(screen.getByRole('button', { name: 'ניסיון נוסף' }));
  expect(state.list.retry).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('משהו מתוק מתבשל כאן...')).toBeNull();
});
it('distinguishes a failed product fetch from a missing product', () => {
  state.detail.error = { code: 'unavailable' };
  render(<MemoryRouter><ProductDetailPage /></MemoryRouter>);
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.queryByText('המוצר לא נמצא')).toBeNull();
});
it('does not reveal hidden product details even to a signed-in administrator using the public route', () => {
  state.detail.product = { id: 'hidden', name: 'שם פרטי מוסתר', description: 'מידע מוסתר', price: 120, isActive: false };
  render(<MemoryRouter><ProductDetailPage /></MemoryRouter>);
  expect(screen.getByText('המוצר לא נמצא')).toBeTruthy();
  expect(screen.queryByText('שם פרטי מוסתר')).toBeNull();
});
