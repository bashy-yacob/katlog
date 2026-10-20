import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { productRepository } from '@/api/catalog/endpoints';
import { importMigration, LOCAL_PRODUCTS_KEY, previewMigration } from '@/api/catalog/migration';
import type { ImportRow } from '@/api/catalog/migration';
import { catalogError } from '@/api/catalog/validation';
import Button from './Button';

export default function ProductMigration() {
  const client = useQueryClient();
  const [raw, setRaw] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [downloaded, setDownloaded] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [source, setSource] = useState<'local' | 'file'>('local');

  const preview = async (text: string, origin: 'local' | 'file') => {
    if (!productRepository || running.current) return;
    running.current = true; setBusy(true); setError(''); setFeedback(''); setRaw(null); setRows([]); setDownloaded(false); setConfirmed(false);
    try {
      const result = await previewMigration(productRepository, text);
      setRows(result); setRaw(text); setSource(origin);
    } catch (cause) { setError(cause instanceof SyntaxError ? 'קובץ המוצרים אינו JSON תקין.' : catalogError(cause)); }
    finally { running.current = false; setBusy(false); }
  };
  const previewLocal = () => {
    try { void preview(localStorage.getItem(LOCAL_PRODUCTS_KEY) ?? '[]', 'local'); }
    catch { setError('לא ניתן לקרוא את המוצרים המקומיים בדפדפן הזה.'); }
  };
  const download = () => {
    if (raw === null) return;
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'royal-icing-products-backup.json'; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000); setDownloaded(true);
  };
  const transfer = async () => {
    if (!productRepository || raw === null || !confirmed || !downloaded || running.current) return;
    try {
      if (source === 'local' && (localStorage.getItem(LOCAL_PRODUCTS_KEY) ?? '[]') !== raw) {
        setError('המוצרים המקומיים השתנו מאז התצוגה המקדימה. הציגי תצוגה מקדימה חדשה.'); return;
      }
    } catch { setError('לא ניתן לקרוא את המוצרים המקומיים. ההעברה לא בוצעה.'); return; }
    running.current = true; setBusy(true); setError('');
    try {
      const result = await importMigration(productRepository, rows, (id, state) => {
        setFeedback(state === 'failed' ? 'ההעברה נעצרה. המוצרים המקומיים לא השתנו.' : `העברת מוצר ${id}: ${state === 'imported' ? 'נשמר' : 'כבר קיים, לא שונה'}`);
      });
      setFeedback(`נוספו ${result.imported} מוצרים. דולגו ${result.skipped}. ${result.failed ? 'ההעברה נעצרה עקב שגיאה; אפשר להציג תצוגה מקדימה חדשה ולנסות שוב.' : 'העותק המקומי נשמר ללא שינוי.'}`);
      setConfirmed(false);
      await client.invalidateQueries({ queryKey: ['products'] });
      // A fresh preview is required after any attempt, including partial completion.
      setRows([]); setRaw(null);
    } catch (cause) { setError(catalogError(cause)); }
    finally { running.current = false; setBusy(false); }
  };

  return <details className="product-migration">
    <summary>העברת מוצרים מהדפדפן או מקובץ גיבוי</summary>
    <p className="form-note">ההעברה מוסיפה מוצרים בלבד. מזהים קיימים לא יידרסו, והעותק המקומי לא יימחק. תמונות קיימות יישמרו כפי שהן.</p>
    <Button tone="quiet" disabled={busy} onClick={previewLocal}>תצוגה מקדימה של מוצרים מקומיים</Button>
    <label htmlFor="products-backup">או בחרי קובץ גיבוי JSON</label>
    <input id="products-backup" className="file-input" type="file" accept="application/json,.json" disabled={busy} onChange={async event => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > 50 * 1024 * 1024) { setError('קובץ הגיבוי גדול מ־50MB.'); return; }
      try { await preview(await file.text(), 'file'); } catch { setError('לא ניתן לקרוא את קובץ הגיבוי.'); }
      event.target.value = '';
    }} />
    {raw !== null && <>
      <p>{rows.length} מוצרים בקובץ; {rows.filter(row => row.state === 'new').length} מוצרים חדשים להעברה.</p>
      <ul>{rows.map((row, index) => <li key={index}>{row.name} <bdi>({row.id || 'ללא מזהה'})</bdi> — {row.state === 'new' ? `${row.input?.isActive ? 'יופיע בקטלוג' : 'יועבר כמוסתר'}${row.createdAt ? ', תאריך היצירה יישמר' : ''}` : row.state === 'existing' ? 'המזהה כבר קיים במסד — לא יועבר ולא ישונה' : row.reason}</li>)}</ul>
      <Button tone="quiet" onClick={download} disabled={busy}>הורדת גיבוי לפני ההעברה</Button>
      <label className="migration-confirm"><input type="checkbox" checked={confirmed} disabled={busy || !downloaded} onChange={event => setConfirmed(event.target.checked)} />שמרתי את קובץ הגיבוי ובדקתי את רשימת המוצרים להעברה</label>
      <Button onClick={() => void transfer()} disabled={busy || !confirmed || !downloaded || !rows.some(row => row.state === 'new')}>העברת המוצרים החדשים בלבד</Button>
    </>}
    {busy && <p role="status">בודקת ושומרת מוצרים, נא להמתין...</p>}
    {feedback && <p role="status">{feedback}</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </details>;
}
