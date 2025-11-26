import type { Express } from "express";
import type { RouteDeps } from "./types";

export function registerChatRoutes(app: Express, deps: RouteDeps): void {
  const { storage } = deps;

  app.get("/api/chat/messages", async (_req, res) => {
    try {
      const messages = await storage.getChatMessages(50);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
}
