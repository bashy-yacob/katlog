import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { auth, db } from '@/config/firebase';
import { createOrderRepository, managementError } from '@/api/orders/management';
import type { ManagedOrder } from '@/api/orders/management';
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '../../../functions/src/order-model';
import type { OrderStatus, PriceConfirmation } from '../../../functions/src/order-model';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import PageHeading from '@/components/PageHeading';
import { useDocumentTitle } from '@/hooks';
import { formatPrice } from '@/utils/helpers';
import './AdminOrdersPage.css';

const repository = db ? createOrderRepository(db) : null;
const date = (value: Date) => value.toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });
const money = (value: number | null) => value === null ? 'טרם נקבע' : formatPrice(value);

export function OrderEditor({ entry, onClose, onSaved }: { entry: ManagedOrder; onClose: () => void; onSaved: () => void }) {
  const { order } = entry;
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [quote, setQuote] = useState(order.quotedPrice?.toString() ?? '');
  const [notes, setNotes] = useState(order.internalNotes);
  const [action, setAction] = useState<PriceConfirmation['action']>('keep');
  const [confirmed, setConfirmed] = useState(order.confirmedPrice?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true; setSaving(true); setError('');
    try {
      if (!repository || !auth?.currentUser) throw new Error('יש להתחבר מחדש לניהול.');
      if (action === 'confirm' && !confirmed.trim()) throw new Error('יש להזין מחיר לאישור.');
      await repository.update(entry, { status, quotedPrice: quote.trim() ? Number(quote) : null, internalNotes: notes,
        priceConfirmation: action === 'confirm' ? { action, price: Number(confirmed) } : { action } }, auth.currentUser.uid);
      onSaved();
    } catch (cause) { setError(managementError(cause)); }
    finally { inFlight.current = false; setSaving(false); }
  };
  return <Modal isOpen title={`בקשה ${order.orderNumber}`} onClose={() => { if (!inFlight.current) onClose(); }} className="order-editor">
    <dl className="order-details">
      <div><dt>לקוחה</dt><dd>{order.customerName}</dd></div>
      <div><dt>טלפון</dt><dd dir="ltr">{order.customerPhone}</dd></div>
      <div><dt>אימייל</dt><dd>{order.customerEmail || 'לא נמסר'}</dd></div>
      <div><dt>מוצר בעת הבקשה</dt><dd>{order.productSnapshot.name}</dd></div>
      <div><dt>כמות</dt><dd>{order.quantity}</dd></div>
      <div><dt>תאריך איסוף מבוקש</dt><dd>{order.requestedPickupDate}</dd></div>
      <div><dt>טקסט מבוקש</dt><dd>{order.requestedText || 'לא נמסר'}</dd></div>
      <div><dt>צבעים מועדפים</dt><dd>{order.preferredColors || 'לא נמסרו'}</dd></div>
      <div><dt>התאמות ובקשות</dt><dd>{order.customizationNotes || 'לא נמסרו'}</dd></div>
      <div><dt>נוצרה</dt><dd>{date(order.createdAt)}</dd></div>
      <div><dt>עודכנה</dt><dd>{date(order.updatedAt)}</dd></div>
      <div><dt>מחיר מאושר</dt><dd>{money(order.confirmedPrice)}{order.priceConfirmedAt && ` · ${date(order.priceConfirmedAt)}`}</dd></div>
    </dl>
    <p className="ui-notice">איסוף עצמי בלבד. עדכון סטטוס אינו שולח הודעה ללקוחה.</p>
    <form className="brand-form" onSubmit={event => void submit(event)}>
      <fieldset disabled={saving}>
        <div className="form-group"><label htmlFor="order-status">סטטוס</label><select id="order-status" value={status} onChange={event => setStatus(event.target.value as OrderStatus)}>{ORDER_STATUSES.map(value => <option key={value} value={value}>{ORDER_STATUS_LABELS[value]}</option>)}</select></div>
        <div className="form-group"><label htmlFor="order-quote">הצעת מחיר כוללת (₪)</label><input id="order-quote" type="number" min="0" max="1000000" step="0.01" value={quote} onChange={event => setQuote(event.target.value)} /></div>
        <div className="form-group"><label htmlFor="order-price-action">אישור מחיר</label><select id="order-price-action" value={action} onChange={event => setAction(event.target.value as PriceConfirmation['action'])}><option value="keep">שמירת האישור הקיים</option><option value="confirm">אישור מחיר מפורש</option><option value="clear">ביטול אישור המחיר הקיים</option></select></div>
        {action === 'confirm' && <div className="form-group"><label htmlFor="order-confirmed-price">מחיר כולל מאושר (₪)</label><input id="order-confirmed-price" type="number" min="0" max="1000000" step="0.01" required value={confirmed} onChange={event => setConfirmed(event.target.value)} /></div>}
        {action === 'clear' && <p className="ui-notice">שמירה תסיר את המחיר המאושר ואת פרטי האישור.</p>}
        <div className="form-group"><label htmlFor="order-notes">הערות פנימיות</label><textarea id="order-notes" maxLength={5000} rows={4} value={notes} onChange={event => setNotes(event.target.value)} /></div>
      </fieldset>
      {error && <p role="alert" className="form-error">{error}</p>}
      <Button type="submit" disabled={saving}>{saving ? 'שומרת...' : 'שמירת שינויים'}</Button>
      <Button tone="quiet" disabled={saving} onClick={onClose}>סגירה</Button>
    </form>
  </Modal>;
}

export default function AdminOrdersPage() {
  useDocumentTitle('ניהול הזמנות - Royal Icing');
  const client = useQueryClient();
  const orders = useQuery({ queryKey: ['admin', 'orders'], queryFn: () => repository!.list(), enabled: !!repository, retry: false, refetchInterval: 30000, refetchIntervalInBackground: false });
  const [selected, setSelected] = useState<ManagedOrder | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [feedback, setFeedback] = useState('');
  const needle = search.trim().toLocaleLowerCase();
  const visible = (orders.data?.orders ?? []).filter(({ order }) => (!status || order.status === status) && [order.orderNumber, order.customerName, order.customerPhone, order.productSnapshot.name].some(value => value.toLocaleLowerCase().includes(needle)));
  return <section className="admin-content admin-orders-page">
    <PageHeading eyebrow="סביבת ניהול" title="ניהול הזמנות" description="בקשות מהאתר, תיאום איסוף ומחירים שנקבעים ידנית." />
    <p role="status" className="ui-feedback">{feedback}</p>
    {!repository ? <p role="alert" className="ui-notice">יש להשלים את חיבור Firebase לפני ניהול ההזמנות.</p> : <>
      <div className="orders-toolbar brand-form">
        <div className="form-group"><label htmlFor="orders-search">חיפוש לפי מספר, לקוחה, טלפון או מוצר</label><input id="orders-search" type="search" value={search} onChange={event => setSearch(event.target.value)} /></div>
        <div className="form-group"><label htmlFor="orders-filter">סינון סטטוס</label><select id="orders-filter" value={status} onChange={event => setStatus(event.target.value)}><option value="">כל הסטטוסים</option>{ORDER_STATUSES.map(value => <option key={value} value={value}>{ORDER_STATUS_LABELS[value]}</option>)}</select></div>
        <Button tone="quiet" disabled={orders.isFetching} onClick={() => void orders.refetch()}>{orders.isFetching ? 'מרעננת...' : 'רענון'}</Button>
      </div>
      {orders.isError && <p role="alert" className="form-error">{managementError(orders.error)}{orders.data && ' מוצגת הרשימה האחרונה שנטענה.'}</p>}
      {!!orders.data?.invalidCount && <p role="alert" className="ui-notice">{orders.data.invalidCount} בקשות לא הוצגו עקב נתונים לא תקינים. הנתונים לא שונו; נדרשת בדיקה.</p>}
      {orders.isPending ? <p role="status">טוענת הזמנות...</p> : orders.data && (visible.length ? <table className="orders-table"><caption>{visible.length} בקשות מוצגות</caption><thead><tr>{['מספר בקשה', 'לקוחה וטלפון', 'מוצר וכמות', 'איסוף מבוקש', 'סטטוס', 'מחיר מאושר', 'נוצרה', 'פרטים'].map(title => <th scope="col" key={title}>{title}</th>)}</tr></thead><tbody>{visible.map(entry => <tr key={entry.order.id}>
        <td data-label="מספר בקשה"><bdi>{entry.order.orderNumber}</bdi></td><td data-label="לקוחה וטלפון">{entry.order.customerName}<br /><bdi>{entry.order.customerPhone}</bdi></td><td data-label="מוצר וכמות">{entry.order.productSnapshot.name} · {entry.order.quantity}</td><td data-label="איסוף מבוקש">{entry.order.requestedPickupDate}</td><td data-label="סטטוס"><span className={`order-status order-status-${entry.order.status}`}>{ORDER_STATUS_LABELS[entry.order.status]}</span></td><td data-label="מחיר מאושר">{money(entry.order.confirmedPrice)}</td><td data-label="נוצרה">{date(entry.order.createdAt)}</td><td><Button tone="quiet" onClick={() => { setSelected(entry); setFeedback(''); }} aria-label={`פרטי בקשה ${entry.order.orderNumber}`}>פרטים ועדכון</Button></td>
      </tr>)}</tbody></table> : <p>{orders.data.orders.length ? 'לא נמצאו בקשות שמתאימות לסינון.' : orders.data.invalidCount ? 'אין בקשות תקינות להצגה.' : 'טרם התקבלו בקשות הזמנה.'}</p>)}
    </>}
    {selected && <OrderEditor key={selected.order.id} entry={selected} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); setFeedback('השינויים נשמרו בהצלחה.'); void client.invalidateQueries({ queryKey: ['admin', 'orders'] }); }} />}
  </section>;
}
