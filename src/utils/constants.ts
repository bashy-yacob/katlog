import type { Product } from '@/types';

// Environment variables
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
export const IS_DEV = import.meta.env.DEV;
export const IS_PROD = import.meta.env.PROD;

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1;

// Query keys for React Query
export const QUERY_KEYS = {
  products: ['products'],
  product: (id: string) => ['products', id],
  leads: ['leads'],
  lead: (id: string) => ['leads', id],
} as const;

// Mock Products Data
export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'מארז פרחי אביב',
    description: 'עוגיות חמאה פריכות בעיטור פרחי רויאל אייסינג עדינים.',
    price: 180,
    category: 'עיצובים עונתיים',
    image: '',
  },
  {
    id: '2',
    name: 'סט יום הולדת נסיכות',
    description: 'כתרים, שמלות ולבבות בגווני ורוד וזהב מלכותי.',
    price: 220,
    category: 'יום הולדת',
    image: '',
  },
  {
    id: '3',
    name: 'עוגיות מיתוג לעסק',
    description: 'לוגו החברה שלכם בזילוף מדויק ומרשים לכל אירוע עסקי.',
    price: 250,
    category: 'תאגידי',
    image: '',
  },
  {
    id: '4',
    name: 'מארז הולדת בן',
    description: 'בגדי גוף, עגלות וסוסי נדנדה בתכלת ולבן קלאסי.',
    price: 200,
    category: 'יום הולדת',
    image: '',
  },
];
