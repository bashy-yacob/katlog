import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminAuthProvider from '@/auth/AdminAuthProvider';
import RequireAdmin from '@/auth/RequireAdmin';
import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import { useAdminAuth } from '@/auth/auth-context';
import { queryClient } from '@/services/queryClient';

const mocks = vi.hoisted(() => ({
  listener: undefined as undefined | ((user: unknown) => Promise<void>),
  auth: { currentUser: null as unknown },
  token: vi.fn(), login: vi.fn(), logout: vi.fn(), unsubscribe: vi.fn(),
}));
vi.mock('@/config/firebase', () => ({ auth: mocks.auth, db: null, storage: null }));
vi.mock('firebase/auth', () => ({
  onIdTokenChanged: vi.fn((_auth, callback) => { mocks.listener = callback; return mocks.unsubscribe; }),
  getIdTokenResult: mocks.token,
  signInWithEmailAndPassword: mocks.login,
  signOut: mocks.logout,
}));

function PrivatePage() {
  const { logout } = useAdminAuth();
  return <><h1>תוכן ניהול פרטי</h1><button onClick={() => void logout()}>התנתקות</button></>;
}
function mount(path = '/admin/products') {
  return render(<AdminAuthProvider><MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/admin/login" element={<AdminLoginPage />} />
    <Route path="/admin" element={<RequireAdmin />}>
      <Route path="products" element={<PrivatePage />} />
      <Route path="leads" element={<PrivatePage />} />
    </Route>
  </Routes></MemoryRouter></AdminAuthProvider>);
}
async function identity(claims: Record<string, unknown> | null) {
  mocks.token.mockResolvedValue({ claims });
  const user = claims === null ? null : { uid: 'test', getIdToken: vi.fn().mockResolvedValue('token') };
  mocks.auth.currentUser = user;
  await act(async () => { await mocks.listener?.(user); });
}
beforeEach(() => {
  vi.clearAllMocks(); mocks.auth.currentUser = null;
  mocks.login.mockResolvedValue({}); mocks.logout.mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); queryClient.clear(); });

describe('admin route authorization', () => {
  it.each(['/admin/products', '/admin/leads'])('redirects a signed-out direct visit to %s', async path => {
    mount(path); await identity(null);
    expect(screen.getByRole('heading', { name: 'כניסת מנהלת' })).toBeTruthy();
    expect(screen.queryByText('תוכן ניהול פרטי')).toBeNull();
  });
  it('does not render protected content during authorization', () => {
    mount(); expect(screen.getByRole('status').textContent).toContain('בודקת');
    expect(screen.queryByText('תוכן ניהול פרטי')).toBeNull();
  });
  it('allows only the boolean admin claim', async () => {
    mount(); await identity({ admin: 'true' });
    expect(screen.getByRole('heading').textContent).toContain('אין הרשאת');
    await identity({ admin: true });
    expect(screen.getByText('תוכן ניהול פרטי')).toBeTruthy();
  });
  it('closes the page and clears private cache on logout', async () => {
    mount(); await identity({ admin: true });
    queryClient.setQueryData(['orders'], ['private']);
    fireEvent.click(screen.getByRole('button', { name: 'התנתקות' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'כניסת מנהלת' })).toBeTruthy());
    expect(queryClient.getQueryData(['orders'])).toBeUndefined();
  });
  it('removes access when authorization changes', async () => {
    mount(); await identity({ admin: true }); await identity({});
    expect(screen.queryByText('תוכן ניהול פרטי')).toBeNull();
    expect(screen.getByRole('alert').textContent).toContain('מורשית');
  });
  it('fails closed on expired tokens', async () => {
    mount(); await identity({ admin: true });
    mocks.token.mockRejectedValue({ code: 'auth/user-token-expired' });
    await act(async () => { await mocks.listener?.(mocks.auth.currentUser); });
    expect(screen.queryByText('תוכן ניהול פרטי')).toBeNull();
    expect(screen.getByRole('alert').textContent).toContain('ההתחברות פגה');
  });
  it('fails closed if periodic server verification loses the network', async () => {
    mount(); await identity({ admin: true });
    mocks.auth.currentUser = { getIdToken: vi.fn().mockRejectedValue({ code: 'auth/network-request-failed' }) };
    fireEvent.focus(window);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('רשת'));
    expect(screen.queryByText('תוכן ניהול פרטי')).toBeNull();
  });
  it('shows a safe login failure and clears the password', async () => {
    mount('/admin/login'); await identity(null);
    mocks.login.mockRejectedValue({ code: 'auth/network-request-failed', message: 'private server detail' });
    fireEvent.change(screen.getByLabelText('אימייל'), { target: { value: 'test@example.test' } });
    fireEvent.change(screen.getByLabelText('סיסמה'), { target: { value: 'test-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'כניסה לניהול' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('רשת'));
    expect((screen.getByLabelText('סיסמה') as HTMLInputElement).value).toBe('');
    expect(screen.queryByText('private server detail')).toBeNull();
  });
  it('ignores a stale token result after sign-out', async () => {
    mount();
    let resolve!: (value: unknown) => void;
    mocks.token.mockReturnValue(new Promise(done => { resolve = done; }));
    let pending: Promise<void> | undefined;
    act(() => { pending = mocks.listener?.({ uid: 'old' }); });
    await identity(null);
    await act(async () => { resolve({ claims: { admin: true } }); await pending; });
    expect(screen.queryByText('תוכן ניהול פרטי')).toBeNull();
  });
});
