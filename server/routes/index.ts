import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "../storage";
import { rateLimiters } from "../rateLimit";
import { requireAuth, requireTermsAgreement, requireAdminRole } from "../auth";
import { setupWebSocket } from "../realtime";
import type { RouteDeps } from "./types";

import { registerAuthRoutes } from "./auth.routes";
import { registerUsersRoutes } from "./users.routes";
import { registerChatRoutes } from "./chat.routes";
import { registerRoundsRoutes } from "./rounds.routes";
import { registerBetsRoutes } from "./bets.routes";
import { registerStatsRoutes } from "./stats.routes";
import { registerAirdropRoutes } from "./airdrop.routes";
import { registerAdminRoutes } from "./admin.routes";
import { registerMarketsRoutes } from "./markets.routes";
import { registerSportsRoutes } from "./sports.routes";
import { registerVisibilityRoutes } from "./visibility.routes";
import { registerMediaRoutes } from "./media.routes";
import { registerCustomLeaguesRoutes } from "./custom-leagues.routes";

export async function registerRoutes(app: Express, sessionParser: any): Promise<Server> {
  const httpServer = createServer(app);

  const realtime = setupWebSocket(httpServer, sessionParser);

  const deps: RouteDeps = {
    storage,
    rateLimiters,
    requireAuth,
    requireTermsAgreement,
    requireAdminRole,
    realtime
  };

  registerAuthRoutes(app, deps);
  registerUsersRoutes(app, deps);
  registerChatRoutes(app, deps);
  registerRoundsRoutes(app, deps);
  registerBetsRoutes(app, deps);
  registerStatsRoutes(app, deps);
  registerAirdropRoutes(app, deps);
  registerAdminRoutes(app, deps);
  registerMarketsRoutes(app, deps);
  await registerSportsRoutes(app, deps);
  registerVisibilityRoutes(app, deps);
  registerMediaRoutes(app, deps);
  registerCustomLeaguesRoutes(app, deps);

  return httpServer;
}
