import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { IncomingMessage } from "http";
import type session from "express-session";
import { storage } from "./storage";
import { insertChatMessageSchema } from "@shared/schema";
import type { Realtime } from "./routes/types";

interface AuthenticatedWebSocket extends WebSocket {
  walletAddress?: string;
  username?: string;
  isAuthenticated?: boolean;
  request?: IncomingMessage & { session?: session.Session & Partial<session.SessionData> };
}

export function setupWebSocket(
  httpServer: Server,
  sessionParser: any
): Realtime {
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/ws",
    verifyClient: (info, callback) => {
      sessionParser(info.req, {} as any, () => {
        callback(true);
      });
    }
  });

  const broadcastOnlineCount = () => {
    const onlineCount = wss.clients.size;
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "online_count", count: onlineCount }));
      }
    });
  };

  const broadcastGameUpdate = (updateType: string, data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: updateType, data }));
      }
    });
  };

  const broadcastRoundUpdate = (data: any) => {
    broadcastGameUpdate("bet_placed", data);
  };

  const broadcastChat = (message: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "message", message }));
      }
    });
  };

  wss.on("connection", (ws: AuthenticatedWebSocket, request: IncomingMessage) => {
    console.log("Client connected");
    
    ws.request = request as any;

    storage.getChatMessages(50).then((messages) => {
      ws.send(JSON.stringify({ type: "history", messages }));
    });

    storage.getCurrentRound().then(async (round) => {
      if (round) {
        const bets = await storage.getBetsByRound(round.id);
        ws.send(JSON.stringify({
          type: "round_update",
          data: {
            ...round,
            bets,
            timeRemaining: Math.max(0, Math.floor((new Date(round.endTime || new Date()).getTime() - Date.now()) / 1000))
          }
        }));
      }
    });

    broadcastOnlineCount();

    ws.on("message", async (data: Buffer) => {
      try {
        const parsed = JSON.parse(data.toString());

        if (parsed.type === "ws_auth") {
          const { walletAddress } = parsed.data;

          if (!walletAddress) {
            ws.send(JSON.stringify({
              type: "auth_error",
              message: "Wallet address required for authentication"
            }));
            return;
          }

          const session = (ws.request as any)?.session;

          if (!session || !session.walletAddress) {
            ws.send(JSON.stringify({
              type: "auth_error",
              message: "No authenticated session. Please connect and verify your wallet first."
            }));
            console.warn(`⚠️ WebSocket auth attempt without valid session: ${walletAddress}`);
            return;
          }

          if (session.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            ws.send(JSON.stringify({
              type: "auth_error",
              message: "Wallet address mismatch. Session tampering detected."
            }));
            console.error(`🚨 WebSocket auth mismatch - Session: ${session.walletAddress}, Claimed: ${walletAddress}`);
            ws.close(1008, "Authentication failed");
            return;
          }

          const user = await storage.getUserByWalletAddress(walletAddress);

          if (!user) {
            ws.send(JSON.stringify({
              type: "auth_error",
              message: "User not found. Please sign up first."
            }));
            return;
          }

          ws.walletAddress = session.walletAddress;
          ws.username = session.username || user.username || undefined;
          ws.isAuthenticated = true;

          ws.send(JSON.stringify({
            type: "auth_success",
            data: { username: ws.username, walletAddress: ws.walletAddress }
          }));

          console.log(`🔐 WebSocket authenticated: ${ws.username} (${ws.walletAddress})`);
          return;
        }

        if (parsed.type === "chat") {
          if (!ws.isAuthenticated || !ws.username || !ws.walletAddress) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Authentication required to send messages. Please connect your wallet."
            }));
            return;
          }

          const messageData = {
            username: ws.username,
            walletAddress: ws.walletAddress,
            message: parsed.data.message,
            timestamp: new Date()
          };

          const validated = insertChatMessageSchema.parse(messageData);

          const message = await storage.createChatMessage(validated);

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
      console.log("Client disconnected");
      broadcastOnlineCount();
    });
  });

  return {
    broadcastRoundUpdate,
    broadcastChat
  };
}
