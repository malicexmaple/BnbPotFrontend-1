/**
 * Layout constants for BNBPOT gaming platform
 * Centralizes all magic numbers and configuration values
 */

// Sidebar dimensions
export const SIDEBAR = {
  CHAT_WIDTH: 345,
  CHAT_INNER_WIDTH: 297,
  CHAT_MARGIN_TOP: -85,
  CHAT_MARGIN_LEFT: 23,
  LEADERBOARD_WIDTH: 320,
  COLLAPSE_BUTTON_WIDTH_EXPANDED: 34,
  COLLAPSE_BUTTON_WIDTH_COLLAPSED: 34,
  COLLAPSE_BUTTON_HEIGHT: 79,
} as const;

// Carousel configuration
export const CAROUSEL = {
  CARD_WIDTH: 234, // 180 * 1.3
  GAP: 12, // gap-3 = 0.75rem = 12px
  TOTAL_CARDS: 10,
  ANIMATION_SPEED: 0.08, // pixels per millisecond
} as const;

// Game timer
export const GAME = {
  ROUND_DURATION: 13, // seconds
} as const;

// Airdrop box
export const AIRDROP = {
  PARACHUTE_SIZE: 192, // h-48 w-48 = 12rem = 192px
  PARACHUTE_RIGHT: -10,
  PARACHUTE_TOP: -100,
  BALANCE_PADDING_TOP: 6,
} as const;

// Border radius values
export const BORDER_RADIUS = {
  CHAT_HEADER_TOP: '18px 18px 0 0',
  CHAT_BOTTOM: '0 0 18px 18px',
  STANDARD: '18px',
  SMALL: '12px',
  TINY: '4px',
} as const;

// Glass panel styling
export const GLASS_PANEL = {
  BACKGROUND: 'linear-gradient(135deg, rgba(20, 20, 20, 0.8), rgba(30, 30, 30, 0.8))',
  BORDER: '2px solid rgba(60, 60, 60, 0.4)',
  SHADOW: '0 2px 8px rgba(0, 0, 0, 0.5)',
} as const;

// Golden border/accent
export const GOLDEN = {
  BORDER: '2px solid rgba(250, 204, 21, 0.85)',
  SHADOW: '0 0 8px rgba(250, 204, 21, 0.22)',
  GLOW: '0 0 20px rgba(234, 179, 8, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
  BORDER_LIGHT: '2px solid rgba(234, 179, 8, 0.5)',
} as const;

// Dark backgrounds
export const DARK_BG = {
  SOLID: 'rgba(15, 15, 15, 0.9)',
  MEDIUM: 'rgba(20, 20, 20, 0.9)',
  LIGHT: 'rgba(20, 20, 20, 0.8)',
  GRADIENT: 'linear-gradient(135deg, rgba(20, 20, 20, 0.8), rgba(30, 30, 30, 0.8))',
} as const;
