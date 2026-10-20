import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { getIdTokenResult, onIdTokenChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { queryClient } from '@/services/queryClient';
import { AdminAuthContext } from './auth-context';
import type { AuthStatus } from './auth-context';
import { authErrorMessage } from './errors';

export default function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(auth ? 'loading' : 'unconfigured');
  const [error, setError] = useState('');
  const revision = useRef(0);
  const authorizedUid = useRef<string | null>(null);
  useEffect(() => {
    if (!auth) return;
    const firebaseAuth = auth;
    const invalidatePendingChecks = () => { ++revision.current; };
    const unsubscribe = onIdTokenChanged(firebaseAuth, async user => {
      const current = ++revision.current;
      const sameAdmin = Boolean(user && user.uid === authorizedUid.current);
      if (!sameAdmin) {
        setStatus('loading');
        if (user || authorizedUid.current) queryClient.clear();
        else {
          // Initial guest authorization must not cancel public catalog reads.
          queryClient.removeQueries({ predicate: query => query.queryKey[0] === 'admin' || (query.queryKey[0] === 'products' && query.queryKey[1] === 'admin') });
        }
      }
      setError('');
      if (!user) { authorizedUid.current = null; setStatus('signed-out'); return; }
      try {
        const token = await getIdTokenResult(user);
        if (current === revision.current) {
          const isAdmin = token.claims.admin === true;
          authorizedUid.current = isAdmin ? user.uid : null;
          if (!isAdmin) queryClient.clear();
          setStatus(isAdmin ? 'admin' : 'forbidden');
        }
      } catch (cause) {
        if (current === revision.current) { authorizedUid.current = null; queryClient.clear(); setError(authErrorMessage(cause)); setStatus('error'); }
      }
    }, cause => {
      ++revision.current; queryClient.clear(); setError(authErrorMessage(cause)); setStatus('error');
    });
    const verify = () => {
      if (document.visibilityState !== 'visible' || !firebaseAuth.currentUser) return;
      const current = revision.current;
      void firebaseAuth.currentUser.getIdToken(true).catch(cause => {
        if (current !== revision.current) return;
        ++revision.current; queryClient.clear(); setError(authErrorMessage(cause)); setStatus('error');
      });
    };
    window.addEventListener('focus', verify);
    const timer = window.setInterval(verify, 60_000);
    return () => { invalidatePendingChecks(); unsubscribe(); window.removeEventListener('focus', verify); window.clearInterval(timer); };
  }, []);
  const login = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase is not configured');
    setError('');
    try { await signInWithEmailAndPassword(auth, email.trim(), password); }
    catch (cause) { setError(authErrorMessage(cause)); throw cause; }
  };
  const logout = async () => {
    ++revision.current;
    authorizedUid.current = null;
    setStatus('loading'); queryClient.clear();
    try {
      if (auth) await signOut(auth);
      setError(''); setStatus(auth ? 'signed-out' : 'unconfigured');
    } catch (cause) { setError(authErrorMessage(cause)); setStatus('error'); }
  };
  const refresh = async () => {
    if (!auth?.currentUser) { setStatus(auth ? 'signed-out' : 'unconfigured'); return; }
    const user = auth.currentUser;
    const current = ++revision.current;
    setStatus('loading'); setError('');
    try {
      const token = await getIdTokenResult(user, true);
      if (current === revision.current && auth.currentUser === user) {
        const isAdmin = token.claims.admin === true;
        authorizedUid.current = isAdmin ? user.uid : null;
        if (!isAdmin) queryClient.clear();
        setStatus(isAdmin ? 'admin' : 'forbidden');
      }
    } catch (cause) {
      if (current === revision.current) { authorizedUid.current = null; queryClient.clear(); setError(authErrorMessage(cause)); setStatus('error'); }
    }
  };
  return <AdminAuthContext.Provider value={{ status, error, login, logout, refresh }}>{children}</AdminAuthContext.Provider>;
}
