import { useMutation } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { functions, isLeadServiceReady } from '@/config/firebase';
import type { LeadReceipt, LeadRequestInput } from '../../../functions/src/lead-validation';

export function useSubmitLead() {
  const mutation = useMutation({ mutationFn: async (input: LeadRequestInput) => {
    if (!functions || !isLeadServiceReady) throw Object.assign(new Error('Not configured'), { code: 'functions/failed-precondition' });
    const result = await httpsCallable<LeadRequestInput, LeadReceipt>(functions, 'submitLead', { timeout: 35000 })(input);
    if (!result.data || !/^CF-[A-F0-9]{20}$/.test(result.data.leadNumber)) throw Object.assign(new Error('Invalid receipt'), { code: 'functions/unavailable' });
    return result.data;
  }, retry: false });
  return { submit: mutation.mutateAsync, ready: isLeadServiceReady };
}
export function leadError(error: unknown) {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case 'functions/invalid-argument': return { message: 'בדקי את הפרטים שהוזנו ונסי שוב.', uncertain: false };
    case 'functions/resource-exhausted': return { message: 'נשלחו פניות רבות מדי. נסי שוב מאוחר יותר.', uncertain: false };
    case 'functions/permission-denied':
    case 'functions/unauthenticated': return { message: 'לא הצלחנו לאמת את השליחה. רענני את החיבור ונסי שוב.', uncertain: false };
    case 'functions/failed-precondition': return { message: 'לא ניתן לשלוח עם מזהה הפנייה הזה ופרטים שונים. אם כבר שלחת, אין ליצור עותק נוסף.', uncertain: false };
    default: return { message: 'לא ניתן לאשר כרגע שהפנייה נקלטה. ייתכן שהיא נשמרה. נסי שוב עם אותם פרטים כדי לבדוק קליטה ולמנוע כפילות.', uncertain: true };
  }
}
