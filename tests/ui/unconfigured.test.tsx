import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminAuthProvider from '@/auth/AdminAuthProvider';
import RequireAdmin from '@/auth/RequireAdmin';
vi.mock('@/config/firebase', () => ({ auth: null }));
afterEach(cleanup);
it('keeps admin closed without Firebase configuration', () => {
  render(<AdminAuthProvider><MemoryRouter initialEntries={['/admin/products']}><Routes>
    <Route element={<RequireAdmin />}><Route path="/admin/products" element={<h1>private</h1>} /></Route>
  </Routes></MemoryRouter></AdminAuthProvider>);
  expect(screen.getByRole('alert').textContent).toContain('טרם הוגדר');
  expect(screen.queryByText('private')).toBeNull();
});
