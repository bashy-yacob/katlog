import { useState } from 'react';
import { useDocumentTitle } from '@/hooks';
import type { Lead } from '@/types';
import LeadModal from '@/components/LeadModal';
import LeadStatus from '@/components/LeadStatus';
import PageHeading from '@/components/PageHeading';
import PageState from '@/components/PageState';
import Button from '@/components/Button';
import './AdminLeadsPage.css';

export default function AdminLeadsPage() {
  useDocumentTitle('ניהול הזמנות - Royal Icing Catalog');
  // Preserve the existing in-memory lead source; backend integration is separate.
  const [leads, setLeads] = useState<Lead[]>([
    { id: '1', name: 'אבי כהן', email: 'avi@example.com', phone: '050-1234567',
      message: 'מעוניין בהזמנה לאירוע ברחוב הרצל 123', status: 'new', createdAt: new Date() },
    { id: '2', name: 'דן לוי', email: 'dan@example.com', phone: '052-9876543',
      message: 'שאלות לגבי האפשרות להוסיף עיצובים מותאמים', status: 'contacted', createdAt: new Date() },
  ]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleViewLead = (lead: Lead) => { setSelectedLead(lead); setIsModalOpen(true); };
  const handleStatusChange = (leadId: string, newStatus: Lead['status']) => {
    setLeads(previous => previous.map(lead => lead.id === leadId ? { ...lead, status: newStatus } : lead));
    if (selectedLead?.id === leadId) setSelectedLead({ ...selectedLead, status: newStatus });
    setFeedback('סטטוס הפנייה עודכן בתצוגה.');
  };

  return (
    <div className="admin-leads-page">
      <PageHeading eyebrow="הזמנות ופניות · סביבת ניהול" title="ניהול הזמנות ופניות"
        description="כל הפרטים והשיחות, עם תמונה ברורה של מה חדש ומה כבר טופל." />
      <dl className="admin-summary">
        <div><dt>סך הפניות</dt><dd>{leads.length}</dd></div>
        <div><dt>חדשות</dt><dd>{leads.filter(lead => lead.status === 'new').length}</dd></div>
        <div><dt>הושלמו</dt><dd>{leads.filter(lead => lead.status === 'completed').length}</dd></div>
      </dl>
      <p className="ui-feedback" role="status">{feedback}</p>
      {leads.length === 0 ? <PageState title="כל הפניות יופיעו כאן." description="כשיהיו פניות להצגה, תוכלי לעיין בפרטים ולעדכן את הסטטוס שלהן." /> : (
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
      )}
      <LeadModal lead={selectedLead} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onStatusChange={handleStatusChange} />
    </div>
  );
}
