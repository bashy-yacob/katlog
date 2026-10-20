import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import AdminLeadsPage from '@/pages/admin/AdminLeadsPage';

const api = vi.hoisted(() => ({ list: vi.fn(), updateStatus: vi.fn() }));
vi.mock('@/config/firebase', () => ({ db: {} }));
vi.mock('@/hooks', () => ({ useDocumentTitle: vi.fn() }));
vi.mock('@/api/leads/repository', () => ({ createLeadRepository: () => api, leadManagementError: (error: Error) => error.message }));
const entry = { revision: '1:1', lead: { id: 'test-lead', name: 'פנייה מהשרת', email: 'test@example.test', phone: '+972501234567', message: 'פרטים לבדיקה', status: 'new', createdAt: new Date() } };
function mount() { return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><AdminLeadsPage /></QueryClientProvider>); }
beforeEach(() => {
  vi.clearAllMocks(); api.list.mockResolvedValue({ leads: [entry], invalidCount: 0 });
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
afterEach(cleanup);
it('shows server data and waits for status persistence before reporting success', async () => {
  let resolve!: () => void;
  api.updateStatus.mockReturnValue(new Promise<void>(done => { resolve = done; }));
  mount();
  await waitFor(() => expect(screen.getByText('פנייה מהשרת')).toBeTruthy());
  expect(screen.queryByText('אבי כהן')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'פרטי הפנייה של פנייה מהשרת' }));
  fireEvent.click(screen.getByRole('button', { name: 'נוצר קשר' }));
  expect(api.updateStatus).toHaveBeenCalledWith(entry, 'contacted');
  expect(screen.queryByText('סטטוס הפנייה נשמר בהצלחה.')).toBeNull();
  expect((screen.getByRole('button', { name: 'הושלם' }) as HTMLButtonElement).disabled).toBe(true);
  await act(async () => resolve());
  expect(screen.getByText('סטטוס הפנייה נשמר בהצלחה.')).toBeTruthy();
});
it('keeps details open on failure and does not claim the status was saved', async () => {
  api.updateStatus.mockRejectedValue(new Error('הפנייה השתנתה בחלון אחר'));
  mount(); await waitFor(() => expect(screen.getByText('פנייה מהשרת')).toBeTruthy());
  fireEvent.click(screen.getByRole('button', { name: 'פרטי הפנייה של פנייה מהשרת' }));
  fireEvent.click(screen.getByRole('button', { name: 'נוצר קשר' }));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('השתנתה'));
  expect(screen.getByRole('dialog')).toBeTruthy(); expect(screen.queryByText('סטטוס הפנייה נשמר בהצלחה.')).toBeNull();
});
it('shows an empty server collection without falling back to demo leads', async () => {
  api.list.mockResolvedValue({ leads: [], invalidCount: 0 }); mount();
  await waitFor(() => expect(screen.getByText('כל הפניות יופיעו כאן.')).toBeTruthy());
  expect(screen.queryByText('אבי כהן')).toBeNull(); expect(screen.queryByRole('table')).toBeNull();
});
