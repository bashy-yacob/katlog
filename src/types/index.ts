/**
 * 📋 TypeScript Types and Interfaces
 * 
 * זרימת נתונים עם Types:
 * 
 * 1️⃣ PRODUCT TYPE
 *    עוגייה/מוצר בקטלוג
 *    - זורם מ-localStorage (storage.ts)
 *    - משמש ב-CatalogPage, ProductDetailPage, AdminProductsPage
 *    - מעודכן ב-AdminProductsPage (CRUD)
 * 
 * 2️⃣ LEAD TYPE
 *    פנייה/הזמנה של לקוח (מטופס צור קשר)
 *    - יוצר בעת submitContactForm() בContactPage
 *    - משמש ב-AdminLeadsPage
 *    - סטטוס משתנה בטבלה (new → contacted → completed)
 * 
 * 3️⃣ APIRESPONSE TYPE
 *    מבנה תקן לכל תגובה מ-API
 *    - בעתיד: כשנחבור ל-Firebase/REST API
 *    - כרגע: לא בשימוש
 * 
 * 4️⃣ PAGINATEDRESPONSE TYPE
 *    תגובה עם pagination (עמודים)
 *    - לשימוש כשיש הרבה נתונים
 *    - לא בשימוש כרגע
 */

// Catalog types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
}

export type ProductInput = Pick<Product, 'name' | 'description' | 'price' | 'image' | 'category'> & { isActive: boolean };

// Contact/Leads types
export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  productId?: string;
  status: 'new' | 'contacted' | 'completed';
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
