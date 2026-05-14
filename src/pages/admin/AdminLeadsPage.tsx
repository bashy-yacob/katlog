import { useState } from 'react';
import { useDocumentTitle } from '@/hooks';
import { Lead } from '@/types';
import LeadModal from '@/components/LeadModal';
import './AdminLeadsPage.css';

export default function AdminLeadsPage() {
  useDocumentTitle('ניהול הזמנות - Royal Icing Catalog');

  const [leads, setLeads] = useState<Lead[]>([
    {
      id: '1',
      name: 'אבי כהן',
      email: 'avi@example.com',
      phone: '050-1234567',
      message: 'מעוניין בהזמנה לאירוע ברחוב הרצל 123',
      status: 'new',
      createdAt: new Date(),
    },
    {
      id: '2',
      name: 'דן לוי',
      email: 'dan@example.com',
      phone: '052-9876543',
      message: 'שאלות לגבי האפשרות להוסיף עיצובים מותאמים',
      status: 'contacted',
      createdAt: new Date(),
    },
  ]);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // פונקציית עזר לתרגום ועיצוב סטטוס
  const renderStatus = (status: Lead['status']) => {
    const statusMap = {
      new: { text: 'חדש', class: 'status-new' },
      contacted: { text: 'נוצר קשר', class: 'status-contacted' },
      closed: { text: 'סגור', class: 'status-closed' },
    };
    const current = statusMap[status] || statusMap.new;
    return <span className={`status-badge ${current.class}`}>{current.text}</span>;
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleStatusChange = (leadId: string, newStatus: Lead['status']) => {
    setLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead.id === leadId ? { ...lead, status: newStatus } : lead,
      ),
    );
    if (selectedLead?.id === leadId) {
      setSelectedLead({ ...selectedLead, status: newStatus });
    }
  };

  return (
    <div className="admin-container">
      <h1 className="admin-title">ניהול הזמנות ופניות</h1>

      <div className="table-wrapper">
        <table className="leads-table">
          <thead>
            <tr>
              <th>שם הלקוח</th>
              <th>פרטי קשר</th>
              <th>הודעה</th>
              <th>סטטוס</th>
              <th>תאריך פנייה</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td style={{ fontWeight: 'bold' }}>{lead.name}</td>
                <td>
                  <div style={{ fontSize: '0.85rem' }}>{lead.email}</div>
                  <div style={{ fontSize: '0.85rem', color: '#8b5e3c' }}>{lead.phone}</div>
                </td>
                <td title={lead.message}>{lead.message.substring(0, 40)}...</td>
                <td>{renderStatus(lead.status)}</td>
                <td>{lead.createdAt.toLocaleDateString('he-IL')}</td>
                <td>
                  <button className="view-btn" onClick={() => handleViewLead(lead)}>
                    פרטים
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <LeadModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}