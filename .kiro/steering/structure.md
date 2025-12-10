# Project Structure

## Root Level Organization

```
├── programs/           # Solana programs (Rust/Anchor)
├── app/               # Frontend React application
├── tests/             # Integration tests
├── scripts/           # Deployment and utility scripts
├── migrations/        # Deployment migrations
├── deployments/       # Network deployment artifacts
└── solana/           # Solana-specific configuration
```

## Solana Programs (`/programs/`)

Each program follows Anchor conventions:
```
programs/
├── factory/           # Market creation program
│   ├── src/lib.rs    # Main program logic
│   └── Cargo.toml    # Rust dependencies
├── market/            # Individual market operations
└── dashboard/         # Data aggregation program
```

## Frontend Application (`/app/`)

React application with clear separation of concerns:
```
app/src/
├── components/        # Reusable UI components
│   ├── ui/           # Base UI primitives (shadcn/ui)
│   ├── auth/         # Authentication components
│   ├── cards/        # Card-based components
│   ├── charts/       # Data visualization
│   ├── landing/      # Landing page sections
│   ├── layout/       # Layout components
│   ├── market/       # Market-specific components
│   └── terminal/     # Trading terminal components
├── pages/            # Route components
├── hooks/            # Custom React hooks
├── contexts/         # React context providers
├── lib/              # Utility libraries
│   ├── solana/       # Solana-specific utilities
│   └── crossmint/    # Crossmint integration
├── config/           # Configuration files
├── types/            # TypeScript type definitions
├── utils/            # General utilities
├── styles/           # CSS files
└── idl/              # Generated IDL files from programs
```

## Key Conventions

### File Naming
- **Components**: PascalCase (e.g., `MarketCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useMarketData.ts`)
- **Utilities**: camelCase (e.g., `formatters.ts`)
- **Types**: camelCase (e.g., `solana-program-types.ts`)

### Import Patterns
- Use `@/` alias for src imports: `import { cn } from '@/lib/utils'`
- Group imports: external libraries, internal modules, relative imports
- Prefer named exports over default exports for utilities

### Component Structure
- Use functional components with TypeScript
- Props interfaces defined inline or exported
- Custom hooks for complex logic
- Consistent error boundaries and loading states

### Solana Integration
- IDL files auto-generated in `app/src/idl/`
- Program interactions in `lib/solana/`
- Account decoding utilities centralized
- Network configuration in `config/`

### Testing
- Unit tests co-located with source files in `__tests__/` folders
- Integration tests in `/tests/` directory
- E2E tests in `app/src/__tests__/e2e/`

### Configuration Files
- Environment-specific `.env` files at root and app level
- Network configurations in `Anchor.toml`
- Build configurations in `vite.config.ts` and `tsconfig.json`