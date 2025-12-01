# Product Overview

CryptoScore is a decentralized sports prediction market platform built on Solana blockchain. Users can create, join, and participate in prediction markets for sports matches, with outcomes resolved on-chain and rewards distributed automatically.

## Core Features

- **Market Creation**: Users create prediction markets for sports matches with customizable entry fees and visibility (public/private)
- **Predictions**: Participants join markets by submitting predictions (home win, away win, draw) and staking entry fees
- **Resolution**: Market creators resolve matches with final outcomes after completion
- **Rewards**: Winners automatically withdraw their share of the prize pool (minus platform fees)
- **Dashboard**: Real-time tracking of markets, user statistics, leaderboards, and portfolio performance

## Architecture

Three Solana programs power the platform:

1. **Factory Program**: Creates markets and maintains a registry of all markets
2. **Market Program**: Handles predictions, resolution, and reward distribution
3. **Dashboard Program**: Aggregates data for queries and statistics

The frontend is a React-based Web3 trading terminal with real-time updates, multiple themes, and comprehensive market analytics.
