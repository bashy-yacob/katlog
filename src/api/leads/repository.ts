import { collection, doc, getDocFromServer, getDocsFromServer, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { isLeadStatus, validateLeadRequest } from '../../../functions/src/lead-validation.ts';
import type { Lead } from '../../types/index.ts';

export interface ManagedLead { lead: Lead; revision: string }
function version(value: unknown) {
  if (!(value instanceof Timestamp)) throw new Error('תאריך הפנייה אינו תקין.');
  return `${value.seconds}:${value.nanoseconds}`;
}
function online<T>(operation: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('לא התקבלה תשובה מהשרת. בדקי את החיבור ונסי שוב.')), 15000);
    operation.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
  });
}
export function leadManagementError(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === 'permission-denied' || code === 'unauthenticated') return 'אין הרשאה לניהול פניות. התחברי מחדש.';
  return error instanceof Error && !code ? error.message : 'לא ניתן להשלים את הפעולה. בדקי את החיבור ונסי שוב.';
}
export function createLeadRepository(db: Firestore) {
  return {
    async list() {
      const snapshot = await online(getDocsFromServer(collection(db, 'leads')));
      const leads: ManagedLead[] = [];
      let invalidCount = 0;
      for (const item of snapshot.docs) {
        try {
          const value = item.data();
          if (value.schemaVersion !== undefined && value.schemaVersion !== 1) throw new Error('Unsupported schema');
          const fields = validateLeadRequest({ idempotencyKey: '00000000-0000-4000-8000-000000000000', name: value.name, phone: value.phone, email: value.email, message: value.message });
          if (!isLeadStatus(value.status) || !(value.createdAt instanceof Timestamp)) throw new Error('Invalid lead');
          const revision = version(value.updatedAt ?? value.createdAt);
          if (value.leadNumber !== undefined && (typeof value.leadNumber !== 'string' || !/^CF-[A-F0-9]{20}$/.test(value.leadNumber))) throw new Error('Invalid receipt');
          leads.push({ revision, lead: { id: item.id, name: fields.name, phone: fields.phone, email: fields.email, message: fields.message, status: value.status, createdAt: value.createdAt.toDate(), updatedAt: (value.updatedAt ?? value.createdAt).toDate(), ...(value.leadNumber ? { leadNumber: value.leadNumber } : {}) } });
        } catch { invalidCount++; }
      }
      leads.sort((a, b) => b.lead.createdAt.getTime() - a.lead.createdAt.getTime() || a.lead.id.localeCompare(b.lead.id));
      return { leads, invalidCount };
    },
    async updateStatus(entry: ManagedLead, status: Lead['status']) {
      if (!isLeadStatus(status) || !entry.lead.id || entry.lead.id.includes('/')) throw new Error('עדכון הפנייה אינו תקין.');
      const target = doc(db, 'leads', entry.lead.id);
      await online(getDocFromServer(target));
      await runTransaction(db, async transaction => {
        const current = await transaction.get(target);
        if (!current.exists()) throw new Error('הפנייה אינה קיימת עוד. רענני את הרשימה.');
        if (version(current.data().updatedAt ?? current.data().createdAt) !== entry.revision) throw new Error('הפנייה השתנתה בחלון אחר. סגרי ורענני לפני עדכון נוסף.');
        transaction.update(target, { status, updatedAt: serverTimestamp() });
      }, { maxAttempts: 3 });
    },
  };
}
