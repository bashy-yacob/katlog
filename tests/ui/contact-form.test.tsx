import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ContactForm from '@/components/ContactForm';

const api = vi.hoisted(() => ({ submit: vi.fn(), ready: true }));
vi.mock('@/api/leads/endpoints', async importOriginal => ({ ...await importOriginal<typeof import('@/api/leads/endpoints')>(), useSubmitLead: () => api }));
beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); api.ready = true; });
afterEach(cleanup);
function fill() {
  for (const [label, value] of [['שם מלא *', 'לקוחה לבדיקה'], ['טלפון *', '0501234567'], ['אימייל *', 'test@example.test'], ['הודעה *', 'שאלה כללית']]) fireEvent.change(screen.getByLabelText(label), { target: { value } });
}
it('validates required fields before sending', () => {
  const view = render(<ContactForm />); fireEvent.submit(view.container.querySelector('form')!);
  expect(api.submit).not.toHaveBeenCalled(); expect(screen.getByRole('alert').textContent).toContain('השדות המסומנים');
  expect(screen.getByLabelText('אימייל *').getAttribute('aria-invalid')).toBe('true');
});
it('waits for server acknowledgement and prevents duplicate submission', async () => {
  let resolve!: (value: unknown) => void;
  api.submit.mockReturnValue(new Promise(done => { resolve = done; }));
  const view = render(<ContactForm />); fill();
  fireEvent.submit(view.container.querySelector('form')!); fireEvent.submit(view.container.querySelector('form')!);
  expect(api.submit).toHaveBeenCalledTimes(1); expect(screen.queryByText('הפנייה התקבלה')).toBeNull();
  await act(async () => resolve({ leadNumber: 'CF-0123456789ABCDEF0123' }));
  expect(screen.getByText('הפנייה התקבלה')).toBeTruthy(); expect(sessionStorage.getItem('royal-icing-contact-key')).toBeNull();
});
it('keeps input and retries the exact request when an acknowledgement is lost', async () => {
  api.submit.mockRejectedValueOnce({ code: 'functions/unavailable' }).mockResolvedValueOnce({ leadNumber: 'CF-0123456789ABCDEF0123' });
  const view = render(<ContactForm />); fill(); fireEvent.submit(view.container.querySelector('form')!);
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('ייתכן שהיא נשמרה'));
  expect((screen.getByLabelText('הודעה *') as HTMLTextAreaElement).value).toBe('שאלה כללית');
  expect((screen.getByLabelText('הודעה *') as HTMLTextAreaElement).closest('fieldset')!.disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'בדיקת קליטת הפנייה וניסיון חוזר' }));
  await waitFor(() => expect(screen.getByText('הפנייה התקבלה')).toBeTruthy());
  expect(api.submit.mock.calls[0][0]).toEqual(api.submit.mock.calls[1][0]);
});
it('shows rate limiting without clearing the message or inventing success', async () => {
  api.submit.mockRejectedValue({ code: 'functions/resource-exhausted' });
  const view = render(<ContactForm />); fill(); fireEvent.submit(view.container.querySelector('form')!);
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('פניות רבות מדי'));
  expect((screen.getByLabelText('הודעה *') as HTMLTextAreaElement).value).toBe('שאלה כללית');
  expect(screen.queryByText('הפנייה התקבלה')).toBeNull();
});
it('does not send when Firebase/App Check is unconfigured', () => {
  api.ready = false;
  const view = render(<ContactForm />); fireEvent.submit(view.container.querySelector('form')!);
  expect(api.submit).not.toHaveBeenCalled(); expect(screen.getByRole('alert').textContent).toContain('עדיין אינה זמינה');
});
it('reuses a persisted request identifier without storing customer details', async () => {
  const key = crypto.randomUUID(); sessionStorage.setItem('royal-icing-contact-key', key);
  api.submit.mockRejectedValue({ code: 'functions/resource-exhausted' });
  const view = render(<ContactForm />); fill(); fireEvent.submit(view.container.querySelector('form')!);
  await waitFor(() => expect(api.submit).toHaveBeenCalled());
  expect(api.submit.mock.calls[0][0].idempotencyKey).toBe(key);
  expect(sessionStorage.length).toBe(1); expect(sessionStorage.getItem('royal-icing-contact-key')).toBe(key);
});
