import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/auth/auth-context';
import Button from '@/components/Button';
import PageHeading from '@/components/PageHeading';
import { useDocumentTitle } from '@/hooks';

export default function AdminLoginPage() {
  useDocumentTitle('כניסת מנהלת - Royal Icing');
  const { status, error, login, logout, refresh } = useAdminAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const from: unknown = location.state?.from;
  const destination = typeof from === 'string' && /^\/admin\/(products|leads|orders)\/?$/.test(from) ? from : '/admin/products';
  if (status === 'admin') return <Navigate to={destination} replace />;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try { await login(email, password); }
    catch { /* The provider supplies a safe, localized error. */ }
    finally { setPassword(''); setSubmitting(false); }
  };
  return <div className="system-page brand-wrap">
    <PageHeading eyebrow="סביבת ניהול" title="כניסת מנהלת" description="הכניסה מיועדת למנהלת העסק בלבד." />
    {status === 'unconfigured' ? <p className="ui-notice" role="alert">חיבור Firebase טרם הוגדר. יש להשלים את הגדרות המערכת לפני הכניסה לניהול.</p>
      : status === 'loading' ? <p role="status">בודקת התחברות...</p>
      : status === 'forbidden' ? <div><p className="form-error" role="alert">אין הרשאת ניהול לחשבון הזה.</p><Button onClick={() => void logout()}>יציאה והחלפת חשבון</Button></div>
      : <form className="brand-form" onSubmit={submit} style={{ maxWidth: 440 }}>
        <div className="form-group"><label htmlFor="admin-email">אימייל</label><input id="admin-email" type="email" autoComplete="username" dir="ltr" value={email} onChange={event => setEmail(event.target.value)} required disabled={submitting} /></div>
        <div className="form-group"><label htmlFor="admin-password">סיסמה</label><input id="admin-password" type="password" autoComplete="current-password" dir="ltr" value={password} onChange={event => setPassword(event.target.value)} required disabled={submitting} /></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <Button type="submit" disabled={submitting}>{submitting ? 'מתחברת...' : 'כניסה לניהול'}</Button>
        {status === 'error' && <><Button tone="quiet" onClick={() => void refresh()}>בדיקת חיבור מחדש</Button><Button tone="quiet" onClick={() => void logout()}>יציאה מהחשבון</Button></>}
      </form>}
  </div>;
}
