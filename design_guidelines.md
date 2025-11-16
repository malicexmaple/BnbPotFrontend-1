# BNBPOT.COM Design Guidelines

## Design Approach: Reference-Based (Crypto Gambling Platform)

**Primary Reference**: solpot.com - crypto gambling interface with dark theme, player-centric visualization, and real-time game state

**Core Design Principles**:
- Gaming-first interface optimized for rapid decision-making
- High-contrast dark theme for extended viewing sessions
- Trust through transparency (blockchain verification, provably fair)
- Real-time feedback for all interactions

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, and 16
- Tight spacing (p-2, gap-2) for compact game controls
- Medium spacing (p-4, gap-4) for component separation
- Large spacing (p-8, p-12) for major section breaks

**Grid Structure**:
- Main content area: 70% width (game canvas + betting controls)
- Chat sidebar: 30% width (fixed right)
- Mobile: Stack chat below game (full width each)

**Container Strategy**:
- Full viewport height application (h-screen)
- No max-width constraints on main game area
- Chat sidebar: fixed width on desktop (380px), full width mobile

## Typography

**Font Families**:
- Primary: Inter (via Google Fonts) - UI elements, buttons, labels
- Monospace: JetBrains Mono - numbers, timers, bet amounts, addresses

**Type Scale**:
- Hero numbers (jackpot value): text-5xl to text-6xl, font-bold
- Countdown timer: text-4xl, font-mono
- Game stats: text-2xl, font-semibold
- Bet amounts: text-xl, font-mono
- Body/Chat: text-sm to text-base
- Labels: text-xs, uppercase, tracking-wide

## Component Library

### Navigation
- Top horizontal nav bar (h-16)
- Logo left, game tabs center (Jackpot, Coinflip, Affiliates)
- Connect wallet button right (prominent, gradient border)
- Sticky positioning

### Game Canvas
**Player Slots Visualization**:
- 15 circular slots arranged in concentric circles
- Each slot: avatar image, username, bet amount, win percentage
- Active slots: full opacity with gradient border
- Waiting slots: low opacity (30%), grayscale
- Center: jackpot total value with pulsing glow effect

**Countdown Timer**:
- Large monospace display (MM:SS format)
- Color transitions: green → yellow → red as time expires
- Block mining status indicator below

### Betting Interface
**Bet Input Panel** (fixed bottom or right of game canvas):
- SOL amount input (large, monospace)
- Quick bet buttons: +0.1, +1 (inline, small)
- USD equivalent (text-sm, muted)
- Place Bet button (full width, gradient background)
- Your current stats: wager amount, win percentage

**Game Information**:
- Total bets counter
- Round number
- Provably fair indicator

### Live Chat Sidebar
- Header: "Degen Chat" + online count
- Message list (scrollable, auto-scroll to bottom)
- Message format: timestamp, avatar (32px), username with level badge, message text
- Input field at bottom (send button integrated)
- Chat rules link in footer

### Wallet Connection
- Prominent "Connect" button in nav (when disconnected)
- Connected state: wallet address (truncated), avatar, disconnect option
- Connection modal: list of wallet options (Phantom, Solflare, etc.)

### Footer Links
- Compact horizontal layout
- Links: Provably Fair, Terms of Service, Support
- 3D toggle switch (experimental feature)

## Visual Treatment

**Dark Theme Palette** (no specific colors provided, describe hierarchy):
- Background: Very dark (near black)
- Surface: Slightly lighter dark for panels/cards
- Accents: Purple/pink gradients for CTAs, highlights, active states
- Text primary: Near white, high contrast
- Text secondary: Muted gray
- Success: Green tones
- Warning: Yellow/orange tones
- Error: Red tones

**Gradients**:
- Primary CTA buttons: Purple to pink gradient
- Player slot borders (active): Subtle gradient glow
- Jackpot value display: Gradient text effect

**Borders & Shadows**:
- Cards/panels: 1px border with subtle glow
- Elevated elements: Soft shadow (shadow-lg)
- No hard edges - prefer rounded corners (rounded-lg to rounded-xl)

**Glass Morphism** (selective use):
- Chat messages background: Subtle blur with low opacity
- Betting panel background: Semi-transparent with backdrop blur

## Animations

**Essential Only**:
- Jackpot value: Subtle pulsing glow (2s loop)
- Timer: Color transition as countdown progresses
- Bet placement: Brief scale animation on player slot
- Chat messages: Fade-in on new message
- Loading states: Spinner for wallet connection

**No Animations**:
- Page transitions
- Hover effects on static elements
- Decorative particles or effects

## Images

**Where Images Appear**:
- Player avatars (generated or uploaded, 32px-64px)
- Wallet provider logos (in connection modal)
- Solana logo (currency indicator)
- User level badges/icons

**No Hero Image**: This is a functional gaming interface, not a marketing page

## Accessibility

- High contrast text on dark backgrounds (WCAG AA minimum)
- Focus states on all interactive elements (visible outline)
- Keyboard navigation for betting controls and chat
- Screen reader labels for game state, timer, player slots
- Avoid reliance on color alone for critical information (e.g., timer shows numbers AND color)

## Responsive Behavior

**Desktop (1024px+)**:
- Side-by-side game canvas and chat
- Full player slot visualization

**Tablet (768px-1023px)**:
- Narrower chat sidebar OR stack chat below
- Compact betting controls

**Mobile (<768px)**:
- Stacked layout: nav → game → betting controls → chat
- Condensed player slots (fewer visible, swipe to view all)
- Bottom sheet for betting interface

## Key UX Patterns

- **Immediate Feedback**: Every bet placement shows instant confirmation
- **Real-time Updates**: Game state, chat, player positions update without refresh
- **Trust Indicators**: Blockchain transaction links, provably fair verification prominent
- **Progressive Disclosure**: Advanced features (3D view, fairness verification) accessible but not cluttering main interface
- **Chat Integration**: Community engagement without distracting from primary game action