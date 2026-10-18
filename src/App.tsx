/**
 * 🎯 App Component - נקודת כניסה ראשית
 * 
 * מטרה: עטיפה של כל האפליקציה עם providers חשובים
 * 
 * Providers:
 *   1. QueryClientProvider: מספק את React Query client
 *      → משמש לניהול state של server (API data)
 *      → מאפשר caching, refetching של API calls
 * 
 *   2. RouterProvider: מספק את מערכת הניתוב
 *      → משמש להחלפה בין עמודים שונים
 *      → אחראי על היסטוריה של הדפדפן (back/forward)
 * 
 * זרימת נתונים:
 *   App → QueryClientProvider → RouterProvider → routes → עמודים שונים
 * 
 * הערה: כל component בתוך אפליקציה יכול להשתמש ב:
 *       - React Query hooks (useQuery, useMutation)
 *       - React Router hooks (useNavigate, useParams וכו')
 */
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/services/queryClient';
import router from '@/routes';


export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
