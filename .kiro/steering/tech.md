# Technology Stack

## Blockchain

- **Solana**: Layer 1 blockchain (devnet/testnet/mainnet-beta)
- **Anchor Framework 0.30+**: Rust framework for Solana program development
- **Rust**: Smart contract language (latest stable)
- **Solana CLI 1.18+**: Command-line tools for deployment and testing

## Frontend

- **React 19.2**: UI framework with latest features
- **TypeScript 5.9**: Strict mode enabled for type safety
- **Vite 7.1**: Build tool and dev server
- **Tailwind CSS 4.1**: Utility-first styling with custom design tokens
- **@solana/web3.js 1.95**: Solana JavaScript SDK
- **@solana/wallet-adapter-react**: Wallet integration (Phantom, Solflare, Backpack, etc.)
- **TanStack Query 5.90**: Data fetching, caching, and real-time updates
- **React Router 7.9**: Client-side routing
- **Radix UI**: Accessible component primitives
- **Recharts 3.4**: Data visualization and charts

## Development Tools

- **ESLint**: @antfu/eslint-config for code linting
- **Prettier**: Code formatting
- **Vitest**: Unit and integration testing
- **ts-mocha**: Anchor program testing

## Common Commands

### Root (Solana Programs)

```bash
# Build programs
yarn build
yarn build:verify  # Build with verification

# Test programs
yarn test

# Deploy
yarn deploy:localnet   # Local validator
yarn deploy:devnet     # Devnet
yarn deploy:mainnet    # Mainnet

# Network configuration
yarn configure:devnet
yarn configure:mainnet

# Local validator
yarn localnet          # Start validator
yarn stop:validator    # Stop validator

# IDL management
yarn idl:sync          # Copy IDLs to frontend
```

### Frontend (app/)

```bash
# Development
npm run dev            # Start dev server (localhost:5173)

# Build
npm run build          # TypeScript compile + Vite build
npm run preview        # Preview production build

# Testing
npm run test           # Run tests once
npm run test:watch     # Watch mode

# Linting
npm run lint           # ESLint with auto-fix
```

## Build System

- **Anchor**: Compiles Rust programs to BPF bytecode, generates IDLs
- **Vite**: Bundles frontend with code splitting and optimizations
- **TypeScript**: Strict type checking before build
- **Manual chunks**: Vendor code separated for better caching (react, wagmi, recharts)

## Environment Variables

Frontend requires `.env` file:

```env
VITE_FACTORY_PROGRAM_ID=<deployed_factory_id>
VITE_MARKET_PROGRAM_ID=<deployed_market_id>
VITE_DASHBOARD_PROGRAM_ID=<deployed_dashboard_id>
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```
