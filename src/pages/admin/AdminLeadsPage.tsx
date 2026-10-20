import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/config/firebase';
import { createLeadRepository, leadManagementError } from '@/api/leads/repository';
import type { ManagedLead } from '@/api/leads/repository';
import { useDocumentTitle } from '@/hooks';
import type { Lead } from '@/types';
import LeadModal from '@/components/LeadModal';
import LeadStatus from '@/components/LeadStatus';
import PageHeading from '@/components/PageHeading';
import PageState from '@/components/PageState';
import Button from '@/components/Button';
import './AdminLeadsPage.css';

const repository = db ? createLeadRepository(db) : null;

export default function AdminLeadsPage() {
  useDocumentTitle('ניהול פניות - Royal Icing Catalog');
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'leads'], queryFn: () => repository!.list(), enabled: !!repository, retry: false, refetchInterval: 30000, refetchIntervalInBackground: false });
  const leads = (query.data?.leads ?? []).map(entry => entry.lead);
  const [selected, setSelected] = useState<ManagedLead | null>(null);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const [saveError, setSaveError] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleViewLead = (lead: Lead) => { setSelected(query.data?.leads.find(entry => entry.lead.id === lead.id) ?? null); setSaveError(''); setFeedback(''); };
  const handleStatusChange = async (leadId: string, newStatus: Lead['status']) => {
    if (inFlight.current || !repository || !selected || selected.lead.id !== leadId) return;
    inFlight.current = true; setSaving(true); setSaveError('');
    try {
      await repository.updateStatus(selected, newStatus);
      setSelected(null); setFeedback('סטטוס הפנייה נשמר בהצלחה.');
      void client.invalidateQueries({ queryKey: ['admin', 'leads'] });
    } catch (cause) { setSaveError(leadManagementError(cause)); }
    finally { inFlight.current = false; setSaving(false); }
  };

  return (
    <div className="admin-leads-page">
      <PageHeading eyebrow="פניות כלליות · סביבת ניהול" title="ניהול פניות"
        description="כל הפרטים והשיחות, עם תמונה ברורה של מה חדש ומה כבר טופל." />
      <dl className="admin-summary">
        <div><dt>סך הפניות</dt><dd>{leads.length}</dd></div>
        <div><dt>חדשות</dt><dd>{leads.filter(lead => lead.status === 'new').length}</dd></div>
        <div><dt>הושלמו</dt><dd>{leads.filter(lead => lead.status === 'completed').length}</dd></div>
      </dl>
      <p className="ui-feedback" role="status">{feedback}</p>
      {!repository ? <p role="alert" className="ui-notice">יש להשלים את חיבור Firebase לפני ניהול הפניות.</p> : <Button tone="quiet" disabled={query.isFetching} onClick={() => void query.refetch()}>{query.isFetching ? 'מרעננת...' : 'רענון פניות'}</Button>}
      {query.isError && <p role="alert" className="form-error">{leadManagementError(query.error)}{query.data && ' מוצגת הרשימה האחרונה שנטענה.'}</p>}
      {!!query.data?.invalidCount && <p role="alert" className="ui-notice">{query.data.invalidCount} פניות לא הוצגו עקב נתונים לא תקינים. הנתונים לא שונו; נדרשת בדיקה.</p>}
      {repository && query.isPending && <p role="status">טוענת פניות...</p>}
      {query.data && (leads.length === 0 ? <PageState title={query.data.invalidCount ? 'אין פניות תקינות להצגה.' : 'כל הפניות יופיעו כאן.'} description="כשיהיו פניות להצגה, תוכלי לעיין בפרטים ולעדכן את הסטטוס שלהן." /> : (
        <div className="leads-table-wrapper">
          <table className="leads-table">
            <caption className="visually-hidden">רשימת פניות וסטטוס הטיפול</caption>
            <thead><tr><th scope="col">שם הלקוח</th><th scope="col">פרטי קשר</th><th scope="col">הודעה</th><th scope="col">סטטוס</th><th scope="col">תאריך פנייה</th><th scope="col">פעולות</th></tr></thead>
            <tbody>{leads.map(lead => (
              <tr key={lead.id}>
                <td data-label="שם הלקוח" className="lead-name">{lead.name}</td>
                <td data-label="פרטי קשר" className="lead-contact"><a href={'mailto:' + lead.email}><bdi>{lead.email}</bdi></a><a href={'tel:' + lead.phone}><bdi>{lead.phone}</bdi></a></td>
                <td data-label="הודעה" className="lead-message" title={lead.message}>{lead.message.length > 40 ? lead.message.substring(0,40) + '…' : lead.message}</td>
                <td data-label="סטטוס"><LeadStatus status={lead.status} /></td>
                <td data-label="תאריך פנייה"><bdi>{lead.createdAt.toLocaleDateString('he-IL')}</bdi></td>
                <td data-label="פעולות" className="lead-actions"><Button tone="quiet" className="view-btn button-compact" onClick={() => handleViewLead(lead)} aria-label={'פרטי הפנייה של ' + lead.name}>פרטים</Button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ))}
      <LeadModal lead={selected?.lead ?? null} isOpen={!!selected} saving={saving} error={saveError} onClose={() => { if (!inFlight.current) setSelected(null); }} onStatusChange={(id, status) => void handleStatusChange(id, status)} />
    </div>
  );
}
