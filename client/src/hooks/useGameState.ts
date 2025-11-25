/**
 * Re-export useGameState from context for backward compatibility
 * The actual state is now managed at the app level to prevent
 * WebSocket reconnections when navigating between pages
 */
export { useGameState } from "@/contexts/GameStateContext";
