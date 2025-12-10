# Technology Stack

## Backend (Solana Programs)

- **Framework**: Anchor v0.30+ (Rust-based Solana development framework)
- **Language**: Rust (latest stable)
- **Blockchain**: Solana (supports localnet, devnet, testnet, mainnet-beta)
- **Programs**: Three separate programs for modular architecture
  - `cryptoscore_factory`: Market creation and management
  - `cryptoscore_market`: Individual market operations
  - `cryptoscore_dashboard`: Data aggregation and analytics

## Frontend

- **Framework**: React 19+ with TypeScript
- **Build Tool**: Vite 7+ with hot reload
- **Styling**: Tailwind CSS v4+ with custom design tokens
- **UI Components**: Radix UI primitives with shadcn/ui patterns
- **State Management**: TanStack Query for server state, React Context for app state
- **Routing**: React Router DOM v7+
- **Wallet Integration**: Solana Wallet Adapter + Crossmint SDK

## Development Tools

- **Package Manager**: Yarn (preferred) or npm
- **Linting**: ESLint with Antfu config, Prettier for formatting
- **Testing**: Vitest for frontend, Anchor test framework for programs
- **TypeScript**: Strict mode enabled with path aliases (`@/*`)

## Common Commands

### Solana Programs
```bash
# Build all programs
yarn build

# Build with verification
yarn build:verify

# Run tests
yarn test

# Deploy to different networks
yarn deploy:localnet
yarn deploy:devnet
yarn deploy:testnet
yarn deploy:mainnet

# Network configuration
yarn configure:devnet
yarn configure:localnet
yarn configure:testnet
yarn configure:mainnet

# Start local validator
yarn localnet

# Export IDLs to frontend
yarn idl:sync
```

### Frontend App
```bash
# Navigate to app directory first
cd app/

# Development server
yarn dev

# Build for production
yarn build

# Type check + build
yarn build:check

# Run tests
yarn test
yarn test:watch

# Linting
yarn lint
```

## Key Dependencies

- **Solana**: `@solana/web3.js`, `@solana/wallet-adapter-*`
- **Anchor**: `@coral-xyz/anchor`
- **React**: `react`, `react-dom`, `react-router-dom`
- **UI**: `@radix-ui/*`, `lucide-react`, `tailwindcss`
- **Utils**: `clsx`, `tailwind-merge`, `borsh`, `bs58`