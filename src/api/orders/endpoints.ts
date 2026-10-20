import { useMutation } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { functions, isOrderServiceReady } from '@/config/firebase';
import type { OrderReceipt, OrderRequestInput } from '../../../functions/src/order-validation';

export function useSubmitOrder() {
  const mutation = useMutation({
    mutationFn: async (input: OrderRequestInput) => {
      if (!functions || !isOrderServiceReady) throw Object.assign(new Error('Order service is not configured'), { code: 'functions/failed-precondition' });
      const call = httpsCallable<OrderRequestInput, OrderReceipt>(functions, 'submitOrder', { timeout: 35000 });
      const result = await call(input);
      if (!result.data || !/^RI-[A-F0-9]{20}$/.test(result.data.orderNumber)) throw Object.assign(new Error('Invalid receipt'), { code: 'functions/unavailable' });
      return result.data;
    },
    retry: false,
  });
  return { submit: mutation.mutateAsync, ready: isOrderServiceReady };
}

export function orderError(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  switch (code) {
    case 'functions/invalid-argument': return { message: 'בדקי את הפרטים שהוזנו ואת תאריך האיסוף ונסי שוב.', uncertain: false };
    case 'functions/not-found': return { message: 'המוצר אינו זמין להזמנה כרגע. אפשר לחזור לקטלוג ולבחור מוצר אחר.', uncertain: false };
    case 'functions/resource-exhausted': return { message: 'נשלחו בקשות רבות מדי. נסי שוב מאוחר יותר.', uncertain: false };
    case 'functions/unauthenticated':
    case 'functions/permission-denied': return { message: 'לא הצלחנו לאמת את השליחה. נסי לרענן את חיבור האינטרנט ולשלוח שוב.', uncertain: false };
    case 'functions/failed-precondition': return { message: 'לא ניתן לשלוח את הבקשה עם הפרטים האלה כרגע. אם כבר שלחת בקשה, אין ליצור עותק נוסף.', uncertain: false };
    default: return { message: 'לא ניתן לאשר כרגע שהבקשה נקלטה. ייתכן שהיא נשמרה. נסי שוב עם אותם פרטים — אותו מזהה ישמש לבדיקת הקליטה ולמניעת כפילות.', uncertain: true };
  }
}
