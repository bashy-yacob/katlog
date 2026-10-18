import type { Lead } from '@/types';
import Modal from './Modal';
import Button from './Button';
import LeadStatus from './LeadStatus';

interface LeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (leadId: string, newStatus: Lead['status']) => void;
}

export default function LeadModal({ lead, isOpen, onClose, onStatusChange }: LeadModalProps) {
  if (!lead) return null;
  return (
    <Modal isOpen={isOpen} title="פרטי פנייה" onClose={onClose} className="lead-modal">
      <div className="modal-body">
        <div className="lead-detail"><strong>שם</strong><p>{lead.name}</p></div>
        <div className="lead-detail"><strong>אימייל</strong><p><a href={'mailto:' + lead.email}><bdi>{lead.email}</bdi></a></p></div>
        <div className="lead-detail"><strong>טלפון</strong><p><a href={'tel:' + lead.phone}><bdi>{lead.phone}</bdi></a></p></div>
        <div className="lead-detail"><strong>הודעה</strong><p>{lead.message}</p></div>
        <div className="lead-detail"><strong>תאריך הפנייה</strong><p>{lead.createdAt.toLocaleDateString('he-IL')}</p></div>
        <div className="lead-detail"><strong>סטטוס נוכחי</strong><p><LeadStatus status={lead.status} /></p></div>
      </div>
      <div className="modal-footer">
        <div className="status-buttons" role="group" aria-label="עדכון סטטוס הפנייה">
          <button type="button" className={'status-btn' + (lead.status === 'new' ? ' active' : '')} aria-pressed={lead.status === 'new'} onClick={() => onStatusChange(lead.id,'new')}>חדש</button>
          <button type="button" className={'status-btn' + (lead.status === 'contacted' ? ' active' : '')} aria-pressed={lead.status === 'contacted'} onClick={() => onStatusChange(lead.id,'contacted')}>נוצר קשר</button>
          <button type="button" className={'status-btn' + (lead.status === 'completed' ? ' active' : '')} aria-pressed={lead.status === 'completed'} onClick={() => onStatusChange(lead.id,'completed')}>הושלם</button>
        </div>
        <Button tone="quiet" className="modal-close-btn" onClick={onClose}>סגור</Button>
      </div>
    </Modal>
  );
}
