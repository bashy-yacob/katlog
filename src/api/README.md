/**
 * This file stores documentation for the API module structure
 * 
 * API Services Structure:
 * 
 * api/
 * ├── catalog/
 * │   ├── types.ts          # Catalog-specific types
 * │   ├── endpoints.ts      # Catalog API endpoints
 * │   └── index.ts          # Catalog API exports
 * ├── leads/
 * │   ├── types.ts
 * │   ├── endpoints.ts
 * │   └── index.ts
 * └── index.ts              # Main API exports
 * 
 * Example usage:
 * 
 * import { useGetProducts, useCreateLead } from '@/api';
 * 
 * // In a component:
 * const { data, isLoading } = useGetProducts();
 * const { mutate: createLead } = useCreateLead();
 */
