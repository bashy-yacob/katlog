# Royal Icing Catalog

A digital catalog application for royal icing cookies business.

## Technologies

- **React 19** with TypeScript
- **Vite** - fast build tool
- **React Router v7** - client-side routing
- **React Query v5** - server state management
- **Lucide React** - icon library
- **Firebase** - backend
- **React Hook Form** - form management

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Project will open at `http://localhost:5173`

### Build

```bash
npm run build
```

## Architecture

```
src/
├── api/              # API integration layer
├── components/       # Reusable UI components
├── features/         # Feature modules
├── hooks/            # Custom React hooks
├── layouts/          # Layout components
├── pages/            # Page components
├── routes/           # Route configuration
├── services/         # Services (React Query, etc.)
├── types/            # TypeScript types
└── utils/            # Utility functions
```

## Routes

- `/` - Home page
- `/catalog` - Product catalog
- `/catalog/:id` - Product details
- `/contact` - Contact form
- `/admin/leads` - Admin panel

## Important Rules

1. **No direct API calls** - All API requests must use React Query hooks
2. **TypeScript** - All files use `.ts` or `.tsx` extensions
3. **Path aliases** - Use `@/` prefix (configured in `tsconfig.json`)
4. **Modular structure** - Keep features self-contained

## Next Steps

### Phase 1 - API Integration (High Priority)
1. Create API endpoints in `src/api/catalog/`
   - `useGetProducts()` - fetch all products
   - `useGetProductById(id)` - fetch single product
2. Create API endpoints in `src/api/leads/`
   - `useCreateLead()` - submit contact form
   - `useGetLeads()` - admin view

### Phase 2 - Firebase Setup (High Priority)
1. Configure Firebase in `src/services/firebase.ts`
2. Set up Firestore collections (products, leads)
3. Connect Pages to API calls

### Phase 3 - Components Enhancement (Medium Priority)
1. Build `ProductCard` with lucide icons
2. Build `LoadingState` and `ErrorBoundary`
3. Upgrade `ImageUpload` with error handling
4. Add responsive UI improvements

## Documentation

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.
See [README_HE.md](./README_HE.md) for documentation in Hebrew.
