import { createContext, useContext } from 'react';

export type AuthStatus = 'loading' | 'signed-out' | 'admin' | 'forbidden' | 'error' | 'unconfigured';
export interface AdminAuthState {
  status: AuthStatus;
  error: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}
export const AdminAuthContext = createContext<AdminAuthState | null>(null);
export function useAdminAuth() {
  const value = useContext(AdminAuthContext);
  if (!value) throw new Error('AdminAuthProvider is required');
  return value;
}
