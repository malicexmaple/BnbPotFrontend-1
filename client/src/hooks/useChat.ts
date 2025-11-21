import { useState, useEffect, useCallback, useRef } from 'react';
import type { ChatMessage } from '@shared/schema';

export function useChat(username: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Only connect if user is logged in
    if (!username) {
      setIsConnected(false);
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
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'history') {
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
    };

    return () => {
      ws.close();
    };
  }, [username]);

  const sendMessage = useCallback((message: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }

    if (!username) {
      console.error('Username is required to send messages');
      return false;
    }

    if (!message.trim()) {
      return false;
    }

    try {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        data: {
          username,
          message: message.trim(),
        },
      }));
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }, [username]);

  return {
    messages,
    isConnected,
    onlineUsers,
    sendMessage,
  };
}
