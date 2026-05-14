# Royal Icing Catalog - Architecture

## Project Structure

```
src/
├── api/              # API integration layer (will use React Query)
├── components/       # Reusable UI components
├── features/         # Feature modules (catalog, leads, admin, etc.)
├── hooks/            # Custom React hooks
├── layouts/          # Layout components (RootLayout, etc.)
├── pages/            # Page components for routes
├── routes/           # Route configuration
├── services/         # Services (React Query client, etc.)
├── types/            # TypeScript types and interfaces
└── utils/            # Utility functions and helpers
```

## Key Technologies

- **React 19** - UI library
- **Vite** - Build tool
- **React Router v7** - Client-side routing
- **React Query v5** - Server state management
- **TypeScript** - Type safety
- **Firebase** - Backend (coming soon)

## Routes

- `/` - Home page
- `/catalog` - Product catalog
- `/catalog/:id` - Product details
- `/contact` - Contact form
- `/admin/leads` - Admin panel for managing leads

## Important Rules

1. **No direct API calls** - All API requests must use React Query hooks
2. **TypeScript** - All files should use `.ts` or `.tsx` extensions
3. **Path aliases** - Use `@/` prefix for imports (configured in `tsconfig.json`)
4. **Modular structure** - Keep features self-contained and reusable

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

## Next Steps

1. Implement API services using React Query
2. Add Firebase integration
3. Create form submission handlers
4. Build feature-specific components
5. Add error handling and loading states
