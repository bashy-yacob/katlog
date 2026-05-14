import { Lead } from '@/types';

interface LeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (leadId: string, newStatus: Lead['status']) => void;
}

export default function LeadModal({ lead, isOpen, onClose, onStatusChange }: LeadModalProps) {
  if (!isOpen || !lead) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>פרטי פנייה</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="lead-detail">
            <strong>שם:</strong>
            <p>{lead.name}</p>
          </div>

          <div className="lead-detail">
            <strong>אימייל:</strong>
            <p>{lead.email}</p>
          </div>

          <div className="lead-detail">
            <strong>טלפון:</strong>
            <p>{lead.phone}</p>
          </div>

          <div className="lead-detail">
            <strong>הודעה:</strong>
            <p>{lead.message}</p>
          </div>

          <div className="lead-detail">
            <strong>תאריך הפנייה:</strong>
            <p>{lead.createdAt.toLocaleDateString('he-IL')}</p>
          </div>

          <div className="lead-detail">
            <strong>סטטוס נוכחי:</strong>
            <p>{lead.status}</p>
          </div>
        </div>

        <div className="modal-footer">
          <div className="status-buttons">
            <button
              className={`status-btn ${lead.status === 'new' ? 'active' : ''}`}
              onClick={() => onStatusChange(lead.id, 'new')}
            >
              חדש
            </button>
            <button
              className={`status-btn ${lead.status === 'contacted' ? 'active' : ''}`}
              onClick={() => onStatusChange(lead.id, 'contacted')}
            >
              יצור קשר
            </button>
            <button
              className={`status-btn ${lead.status === 'completed' ? 'active' : ''}`}
              onClick={() => onStatusChange(lead.id, 'completed')}
            >
              הושלם
            </button>
          </div>

          <button className="modal-close-btn" onClick={onClose}>
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}
