import { useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';

/**
 * Hook to subscribe to game WebSocket updates
 * This is separate from useChat and works for all users (authenticated or not)
 */
export function useGameSocket() {
  useEffect(() => {
    // Determine WebSocket URL based on environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to game WebSocket');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'bet_placed') {
          // Real-time bet update - invalidate round query to trigger refetch
          console.log('Bet placed event received - updating round data');
          queryClient.invalidateQueries({ queryKey: ['/api/rounds/current'] });
        }
        // Ignore chat messages and other events - those are handled by useChat
      } catch (error) {
        console.error('Failed to parse game WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Game WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Disconnected from game WebSocket');
    };

    return () => {
      ws.close();
    };
  }, []);
}
