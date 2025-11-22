import { useState, useEffect, useCallback, useRef } from 'react';
import type { ChatMessage } from '@shared/schema';

interface UseChatProps {
  username: string | undefined;
  walletAddress: string | undefined;
}

export function useChat({ username, walletAddress }: UseChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Only connect if user is logged in
    if (!username || !walletAddress) {
      setIsConnected(false);
      setIsAuthenticated(false);
      setOnlineUsers(0);
      return;
    }

    // Determine WebSocket URL based on environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to chat WebSocket');
      setIsConnected(true);
      
      // Authenticate WebSocket connection
      ws.send(JSON.stringify({
        type: 'ws_auth',
        data: { walletAddress }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'auth_success') {
          console.log('✅ WebSocket authenticated:', data.data.username);
          setIsAuthenticated(true);
        } else if (data.type === 'auth_error') {
          console.error('❌ WebSocket authentication failed:', data.message);
          setIsAuthenticated(false);
        } else if (data.type === 'history') {
          // Parse timestamps from ISO strings to Date objects
          const parsedMessages = data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
          setMessages(parsedMessages);
        } else if (data.type === 'message') {
          // Parse timestamp from ISO string to Date object
          const parsedMessage = {
            ...data.message,
            timestamp: new Date(data.message.timestamp),
          };
          setMessages((prev) => [...prev, parsedMessage]);
        } else if (data.type === 'online_count') {
          // Update online users count
          setOnlineUsers(data.count);
        } else if (data.type === 'error') {
          console.error('Chat error:', data.message);
        }
        // Note: bet_placed events are handled by useGameSocket hook
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('Disconnected from chat WebSocket');
      setIsConnected(false);
      setIsAuthenticated(false);
    };

    return () => {
      ws.close();
    };
  }, [username, walletAddress]);

  const sendMessage = useCallback((message: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }

    if (!isAuthenticated) {
      console.error('WebSocket is not authenticated');
      return false;
    }

    if (!message.trim()) {
      return false;
    }

    try {
      // Server uses authenticated username from WebSocket connection
      // Only send the message content
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        data: {
          message: message.trim(),
        },
      }));
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }, [isAuthenticated]);

  return {
    messages,
    isConnected,
    isAuthenticated,
    onlineUsers,
    sendMessage,
  };
}
