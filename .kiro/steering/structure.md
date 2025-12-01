# Project Structure

## Root Organization

```
.
├── programs/          # Solana programs (Anchor/Rust)
├── app/              # Frontend application (React/TypeScript)
├── tests/            # Integration tests for programs
├── scripts/          # Deployment and utility scripts
├── migrations/       # Deployment migrations
├── deployments/      # Deployment artifacts (program IDs)
└── target/           # Rust build output (gitignored)
```

## Solana Programs (`programs/`)

Three independent Anchor programs:

```
programs/
├── factory/          # Market creation and registry
│   ├── src/lib.rs   # Program logic
│   └── Cargo.toml
├── market/           # Predictions and resolution
│   ├── src/lib.rs
│   └── Cargo.toml
└── dashboard/        # Data aggregation
    ├── src/lib.rs
    └── Cargo.toml
```

### Program Conventions

- **PDA Seeds**: Use descriptive byte strings (`b"factory"`, `b"market"`, `b"participant"`)
- **Account Sizes**: Calculate with discriminator (8 bytes) + fields
- **Error Handling**: Custom error enums with descriptive messages
- **Events**: Emit events for important state changes (indexed fields for filtering)
- **Validation**: Validate all inputs (non-zero fees, future timestamps, string lengths)
- **Bump Seeds**: Store bump in account for efficient PDA derivation

## Frontend (`app/`)

React application with feature-based organization:

```
app/
├── src/
│   ├── components/      # React components
│   │   ├── ui/         # Reusable UI primitives (Radix-based)
│   │   ├── cards/      # Market and portfolio cards
│   │   ├── charts/     # Data visualization
│   │   ├── market/     # Market-specific components
│   │   ├── terminal/   # Trading terminal components
│   │   └── landing/    # Landing page sections
│   ├── pages/          # Route components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and helpers
│   │   └── solana/     # Solana-specific utilities
│   ├── config/         # Configuration (programs, networks)
│   ├── contexts/       # React contexts (theme, etc.)
│   ├── styles/         # CSS files
│   │   ├── tokens.css  # Design system variables
│   │   ├── components.css
│   │   └── animations.css
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Helper functions
│   └── idl/            # Anchor IDL files (copied from programs)
├── public/             # Static assets
├── docs/               # Documentation
└── abi/                # Legacy contract ABIs (deprecated)
```

### Frontend Conventions

- **Path Alias**: Use `@/` for imports from `src/` (e.g., `@/components/ui/button`)
- **Component Files**: PascalCase (e.g., `MarketCard.tsx`)
- **Hook Files**: camelCase with `use` prefix (e.g., `useMarketData.ts`)
- **Utility Files**: camelCase (e.g., `formatters.ts`)
- **Type Files**: Suffix with `.types.ts` or use `types.ts`
- **Styling**: Tailwind utility classes + CSS variables from `tokens.css`
- **State Management**: TanStack Query for server state, React hooks for local state
- **Error Handling**: Try-catch with user-friendly toast notifications

## Key Files

- **Anchor.toml**: Program IDs for all networks, test configuration
- **package.json** (root): Solana program scripts (build, deploy, test)
- **app/package.json**: Frontend dependencies and scripts
- **app/vite.config.ts**: Build configuration, path aliases, chunk splitting
- **app/tsconfig.json**: TypeScript strict mode, path aliases
- **.env files**: Network-specific environment variables

## Testing

```
tests/
├── cryptoscore.ts           # Basic program tests
├── integration/             # End-to-end integration tests
│   ├── end-to-end.ts
│   ├── comprehensive-e2e.ts
│   └── stress-tests.ts
└── utils/                   # Test utilities
    ├── test-setup.ts
    ├── test-accounts.ts
    └── test-assertions.ts
```

Frontend tests in `app/src/__tests__/` (e2e tests for WebSocket, market flows).

## Scripts

```
scripts/
├── deploy.ts              # Multi-network deployment
├── configure-network.ts   # Network configuration
├── export-idls.ts        # IDL export and management
├── build-verify.ts       # Build verification
└── copy-idls.js          # Copy IDLs to frontend
```

## Deployment Artifacts

- **deployments/**: JSON files with deployed program IDs per network
- **target/idl/**: Generated IDL files from Anchor build
- **app/src/idl/**: IDL files copied for frontend use
- **app/dist/**: Production build output (gitignored)
