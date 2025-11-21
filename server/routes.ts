import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertChatMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API route to get chat messages
  app.get("/api/chat/messages", async (_req, res) => {
    try {
      const messages = await storage.getChatMessages(50);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  const httpServer = createServer(app);

  // Set up WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Helper function to broadcast online user count to all clients
  const broadcastOnlineCount = () => {
    const onlineCount = wss.clients.size;
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "online_count", count: onlineCount }));
      }
    });
  };

  wss.on("connection", (ws: WebSocket) => {
    console.log("Client connected to chat");

    // Send existing messages to new client
    storage.getChatMessages(50).then((messages) => {
      ws.send(JSON.stringify({ type: "history", messages }));
    });

    // Send current online count to new client and broadcast to all
    broadcastOnlineCount();

    ws.on("message", async (data: Buffer) => {
      try {
        const parsed = JSON.parse(data.toString());
        
        if (parsed.type === "chat") {
          // TODO: SECURITY - Validate username against authenticated session/wallet
          // Currently trusts client-supplied username which allows impersonation
          // In production, validate username against session store or JWT token
          
          // Validate message format
          const validated = insertChatMessageSchema.parse(parsed.data);
          
          // Save to storage
          const message = await storage.createChatMessage(validated);
          
          // Broadcast to all connected clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: "message", message }));
            }
          });
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected from chat");
      // Broadcast updated count when client disconnects
      broadcastOnlineCount();
    });
  });

  return httpServer;
}
