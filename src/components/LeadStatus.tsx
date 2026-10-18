import type { Lead } from '@/types';

const labels: Record<Lead['status'], string> = {
  new: 'חדש',
  contacted: 'נוצר קשר',
  completed: 'הושלם',
};

export default function LeadStatus({ status }: { status: Lead['status'] }) {
  return <span className={['status-badge', 'status-' + status].join(' ')}>{labels[status] ?? labels.new}</span>;
}
