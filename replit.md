# BNBPOT.COM - Crypto Jackpot Gaming Platform

## Overview

BNBPOT.COM is a crypto gambling platform focused on jackpot-style gaming where the winner takes all. The application provides a real-time, interactive gaming experience currently running in **DEMO MODE** (simulated blockchain). The platform features a dark-themed, gaming-first interface optimized for rapid decision-making and extended viewing sessions.

The application is built as a full-stack TypeScript monorepo with a React frontend, Express backend, and PostgreSQL database. It follows a modern web architecture with real-time capabilities for live game state updates and player interactions.

**Current Status** (November 22, 2025):
- ✅ Production-grade smart contract deployed with Chainlink VRF
- ✅ Complete blockchain event indexer with database syncing
- ✅ Dual-mode operation: blockchain mode + database-only fallback
- ✅ Real-time WebSocket updates for all users
- ✅ Authentication gates (wallet + account + terms required for betting)
- ✅ Game viewing available to everyone (read-only for non-authenticated)
- 📝 Ready for testnet deployment (see BLOCKCHAIN_DEPLOYMENT_GUIDE.md)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- **React with TypeScript**: Component-based UI built with React 18+ using TypeScript for type safety
- **Vite**: Modern build tool providing fast HMR (Hot Module Replacement) and optimized production builds
- **Wouter**: Lightweight routing library for client-side navigation

**UI Component System**
- **shadcn/ui**: Headless component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom theme configuration
- **Dark Mode First**: Application defaults to dark theme optimized for gaming experiences
- **Component Variants**: Uses `class-variance-authority` for consistent component styling variations

**State Management**
- **TanStack Query (React Query)**: Server state management, caching, and data fetching
- **React Hooks**: Local component state management

**Design System**
- **Typography**: Sora (UI elements), DM Mono (monospace numbers/addresses)
- **Color System**: Custom HSL-based theme with support for gradients and gaming aesthetics
- **Spacing**: Tailwind units (2, 4, 6, 8, 12, 16) for consistent layout
- **Border Radius**: Custom values (.1875rem, .375rem, .5625rem) for subtle rounded corners

**Key Layout Decisions**
- **Three-Column Layout**: Navigation header, main game area (70%), chat/betting sidebar (30%)
- **Full Viewport Height**: Application uses `h-screen` for immersive gaming experience
- **Responsive Breakpoints**: Mobile-first approach with chat sidebar stacking below game area on small screens

### Backend Architecture

**Server Framework**
- **Express.js**: Lightweight web server handling HTTP requests and API routing
- **TypeScript**: Type-safe server-side code with ES modules

**Session Management**
- **express-session**: Session handling for user authentication
- **connect-pg-simple**: PostgreSQL-backed session store for production persistence

**API Design**
- **RESTful Endpoints**: API routes prefixed with `/api/`
- **Request Logging**: Custom middleware logs API requests with timing and response data
- **Error Handling**: Centralized error handling with proper HTTP status codes

**Development Workflow**
- **Development Server**: Uses `tsx` for hot-reloading TypeScript execution
- **Production Build**: Bundles server with `esbuild` for optimized deployment
- **Vite Integration**: Development mode proxies frontend through Express with HMR support

### Data Storage

**Database**
- **PostgreSQL**: Primary relational database via Neon serverless platform
- **Drizzle ORM**: Type-safe database queries and migrations
- **Schema Definition**: Centralized schema in `shared/schema.ts` accessible to both client and server

**Current Schema** (Updated November 2025)
- **Users Table**: Wallet-based authentication with username, email, wallet address, terms agreement tracking
- **Rounds Table**: Game rounds with status (waiting/active/completed), pot value, winner tracking
- **Bets Table**: Individual bets linked to rounds and users, with transaction details
- **User Stats Table**: Player statistics (wins, wagered amounts, levels)
- **Daily Stats Table**: Daily winner tracking for leaderboards
- **Chat Messages Table**: Live chat message history
- **Database Connection**: Uses `@neondatabase/serverless` for edge-compatible PostgreSQL access

**In-Memory Storage**
- **MemStorage Class**: Temporary in-memory data store for development
- **Interface Pattern**: `IStorage` interface allows swapping between memory and database implementations

**Migration Strategy**
- **Drizzle Kit**: Schema migrations with `drizzle-kit push` command
- **Type Generation**: Automatic TypeScript types generated from database schema using `drizzle-zod`

### Authentication & Authorization

**Current Implementation** (Demo Mode - Updated November 2025)
- **Wallet-Based Signup**: Users connect wallet, create account with username/email
- **Terms Agreement Tracking**: Database stores terms agreement timestamp
- **Server-Side Validation**: Backend validates user exists and has agreed to terms before accepting bets
- **UI Gating**: Betting controls disabled for non-authenticated users
- **Game Viewing**: Anyone can view games without authentication (read-only mode)

**⚠️ Demo Mode Security Limitation**:
- Current implementation trusts wallet addresses from client without signature verification
- Acceptable for demo mode (no real money at risk)
- **Production requires**: Wallet signature verification, session tokens, protected routes
- See BLOCKCHAIN_INTEGRATION_ROADMAP.md for full security requirements

### Blockchain Integration

**Smart Contract** (Production-Ready)
- **BSC Network**: Binance Smart Chain for low-cost crypto transactions
- **Chainlink VRF**: Verifiable randomness for provably fair winner selection
- **Contract Features**: Reentrancy protection, pausability, two-step ownership, emergency refund
- **Wallet Support**: MetaMask, WalletConnect, and other Web3 wallets

**Event Indexer** (Implemented)
- **Architecture**: Blockchain as source of truth, database as read cache
- **Auto-Sync**: Listens to BetPlaced, RoundStarted, WinnerSelected events
- **Graceful Degradation**: Falls back to database-only mode if blockchain unavailable
- **Round Tracking**: Uses on-chain round IDs to prevent database inconsistencies

**Dual-Mode Operation**:
- **Blockchain Mode** (Production): Smart contract handles winner selection via Chainlink VRF, server syncs to database
- **Database-Only Mode** (Development): Server manages complete round lifecycle with simple weighted random

### External Dependencies

**Blockchain Services**
- **Chainlink VRF**: Decentralized verifiable randomness oracle
- **BSC RPC**: Public RPC endpoints for blockchain reads/writes

**Third-Party Services**
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Google Fonts**: CDN-hosted web fonts (Sora, DM Mono, Architects Daughter, DM Sans, Fira Code, Geist Mono)

**Development Tools**
- **Replit Platform**: Custom Vite plugins for Replit-specific features (cartographer, dev banner, error overlay)
- **Source Maps**: Trace mapping support for debugging minified code

**UI Component Libraries**
- **Radix UI**: 20+ headless accessible components (dialogs, dropdowns, tooltips, etc.)
- **Embla Carousel**: Touch-friendly carousel component
- **cmdk**: Command palette component
- **date-fns**: Date manipulation and formatting
- **Lucide React**: Icon library with 1000+ icons

**Build & Development**
- **Autoprefixer**: PostCSS plugin for vendor prefixes
- **TypeScript**: Strict type checking with path aliases
- **ESLint/Prettier**: Code quality and formatting (configuration assumed)

### API Structure (Planned)

The application currently has minimal API routes but is structured for:
- **Game State Endpoints**: Real-time jackpot values, player lists, game status
- **Betting Endpoints**: Place bets, view bet history
- **User Endpoints**: Authentication, profile management
- **Chat Endpoints**: Live chat message sending/receiving (likely WebSocket-based)

### Real-Time Communication (Planned)

While not yet implemented, the architecture suggests:
- **WebSocket Integration**: For live game updates, chat messages, and player actions
- **Server-Sent Events**: Alternative for one-way real-time updates
- **HTTP Server**: Foundation exists via `createServer(app)` for WebSocket attachment

### Code Organization

**Monorepo Structure**
- `/client`: Frontend React application
- `/server`: Backend Express application  
- `/shared`: Code shared between client and server (schemas, types)
- **Path Aliases**: `@/` (client), `@shared/` (shared), `@assets/` (static assets)

**Component Organization**
- `/components/ui`: Reusable shadcn/ui components
- `/components/examples`: Component usage demonstrations
- Main game components in `/components` root