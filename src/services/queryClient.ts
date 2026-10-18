/**
 * ⚙️ React Query Client Configuration
 * 
 * מטרה: הגדרה מרכזית של React Query לכל ה-API calls
 * 
 * הגדרות (defaultOptions):
 * 
 *   QUERIES (GET requests):
 *     - staleTime: 5 דקות
 *       → כמה זמן נתונים נחשבים "טריים" (לא צריך refetch)
 *     - gcTime: 10 דקות (formerly cacheTime)
 *       → כמה זמן שמור cached data בזיכרון
 *     - retry: 1
 *       → כמה פעמים לנסות שוב בעת כישלון
 *     - refetchOnWindowFocus: false
 *       → אל תעדכן נתונים כשהחלון חוזר לפוקוס
 * 
 *   MUTATIONS (POST/PUT/DELETE requests):
 *     - retry: 1
 *       → נסה שוב פעם אחת בעת כישלון
 * 
 * שימוש:
 *   - Wrapped ב-App.tsx עם <QueryClientProvider client={queryClient}>
 *   - כל hooks ב-components יכולים להשתמש ב-useQuery, useMutation וכו'
 * 
 * בעתיד: כשנחבור ל-Firebase, ה-hooks יישתנו אבל ה-client יישאר זהה
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
