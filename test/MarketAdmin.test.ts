import { expect } from "chai";
import express from "express";
import type { Express, NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";
import type { AddressInfo } from "net";
import type { Server } from "http";
import { eq } from "drizzle-orm";

import { DbStorage } from "../server/storage";
import { db } from "../server/db";
import { markets, marketBets } from "@shared/schema";
import type { InsertMarket, InsertMarketBet, Market } from "@shared/schema";
import { registerMarketsRoutes } from "../server/routes/markets.routes";
import type { RouteDeps, Realtime } from "../server/routes/types";

interface SessionRequest extends Request {
  session?: { walletAddress?: string };
}

function buildApp(storage: DbStorage): Express {
  const app = express();
  app.use(express.json());
  app.use((req: SessionRequest, _res, next) => {
    req.session = { walletAddress: "0xAdmin" };
    next();
  });
  const passthrough = (_req: Request, _res: Response, next: NextFunction) => next();
  const realtime: Realtime = {
    broadcastRoundUpdate: () => {},
    broadcastChat: () => {},
    broadcastMarketsUpdated: () => {},
  };
  const deps: RouteDeps = {
    storage,
    rateLimiters: {
      auth: passthrough,
      api: passthrough,
      general: passthrough,
    },
    requireAuth: passthrough,
    requireTermsAgreement: passthrough,
    requireAdminRole: passthrough,
    realtime,
  };
  registerMarketsRoutes(app, deps);
  return app;
}

interface TestServer {
  url: string;
  close: () => Promise<void>;
}

async function startServer(app: Express): Promise<TestServer> {
  const server: Server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = (server.address() as AddressInfo).port;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((res) => server.close(() => res())),
  };
}

function buildMarketInput(overrides: Partial<InsertMarket> = {}): InsertMarket {
  return {
    sport: "Soccer",
    league: "Premier League",
    leagueId: null,
    marketType: "match_winner",
    teamA: "Team A",
    teamB: "Team B",
    teamALogo: null,
    teamBLogo: null,
    description: "Who wins?",
    isLive: false,
    gameTime: new Date(Date.now() + 60 * 60 * 1000),
    poolATotal: "0",
    poolBTotal: "0",
    bonusPool: "0",
    platformFee: "2.00",
    ...overrides,
  } as InsertMarket;
}

describe("Admin market actions API (integration)", function () {
  this.timeout(20000);

  let storage: DbStorage;
  let server: TestServer;
  const createdMarketIds = new Set<string>();
  let originalConsoleError: typeof console.error;

  before(async function () {
    storage = new DbStorage();
    const app = buildApp(storage);
    server = await startServer(app);
    originalConsoleError = console.error;
    console.error = () => {};
  });

  after(async function () {
    console.error = originalConsoleError;
    await server.close();
    for (const id of createdMarketIds) {
      try {
        await db.delete(marketBets).where(eq(marketBets.marketId, id));
        await db.delete(markets).where(eq(markets.id, id));
      } catch {
        /* best-effort cleanup */
      }
    }
  });

  async function createMarket(overrides: Partial<InsertMarket> = {}): Promise<Market> {
    const market = await storage.createMarket(buildMarketInput(overrides));
    createdMarketIds.add(market.id);
    return market;
  }

  async function setMarketStatus(id: string, status: string): Promise<void> {
    await db.update(markets).set({ status }).where(eq(markets.id, id));
  }

  async function insertBet(marketId: string, overrides: Partial<InsertMarketBet> = {}) {
    return storage.createMarketBet({
      marketId,
      userId: null,
      userAddress: "0xUser",
      outcome: "A",
      amount: "1.00000000",
      oddsAtBet: "2.00",
      status: "active",
      ...overrides,
    } as InsertMarketBet);
  }

  describe("PATCH /api/admin/markets/:id", function () {
    it("updates an active market that has no bets", async function () {
      const market = await createMarket({ description: "Old description" });

      const res = await fetch(`${server.url}/api/admin/markets/${market.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: "New description" }),
      });
      const body = await res.json();

      expect(res.status).to.equal(200);
      expect(body.market.description).to.equal("New description");

      const reloaded = await storage.getMarketById(market.id);
      expect(reloaded?.description).to.equal("New description");
    });

    it("rejects updates when the market is locked", async function () {
      const market = await createMarket({ description: "Untouched" });
      await setMarketStatus(market.id, "locked");

      const res = await fetch(`${server.url}/api/admin/markets/${market.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: "Trying to edit" }),
      });
      const body = await res.json();

      expect(res.status).to.equal(400);
      expect(body.message).to.match(/Cannot edit a market with status 'locked'/);

      const reloaded = await storage.getMarketById(market.id);
      expect(reloaded?.description).to.equal("Untouched");
    });
  });

  describe("DELETE /api/admin/markets/:id", function () {
    it("deletes a market that has no bets", async function () {
      const market = await createMarket();

      const res = await fetch(`${server.url}/api/admin/markets/${market.id}`, {
        method: "DELETE",
      });
      const body = await res.json();

      expect(res.status).to.equal(200);
      expect(body.message).to.equal("Market deleted");

      const reloaded = await storage.getMarketById(market.id);
      expect(reloaded).to.equal(undefined);
      createdMarketIds.delete(market.id);
    });

    it("blocks deletion when bets exist on the market", async function () {
      const market = await createMarket();
      await insertBet(market.id);

      const res = await fetch(`${server.url}/api/admin/markets/${market.id}`, {
        method: "DELETE",
      });
      const body = await res.json();

      expect(res.status).to.equal(400);
      expect(body.message).to.match(/has bets/i);

      const reloaded = await storage.getMarketById(market.id);
      expect(reloaded).to.not.equal(undefined);
    });
  });

  describe("POST /api/admin/markets/:id/refund", function () {
    it("refunds an active market and marks its open bets as refunded", async function () {
      const market = await createMarket();
      const bet1 = await insertBet(market.id, { amount: "1.50000000" });
      const bet2 = await insertBet(market.id, { amount: "2.50000000", outcome: "B" });

      const res = await fetch(`${server.url}/api/admin/markets/${market.id}/refund`, {
        method: "POST",
      });
      const body = await res.json();

      expect(res.status).to.equal(200);
      expect(body.market.status).to.equal("refunded");
      expect(body.refundedBets).to.equal(2);

      const reloaded = await storage.getMarketById(market.id);
      expect(reloaded?.status).to.equal("refunded");

      const bets = await storage.getMarketBetsByMarketId(market.id);
      const byId = new Map(bets.map((b) => [b.id, b]));
      expect(byId.get(bet1.id)?.status).to.equal("refunded");
      expect(byId.get(bet2.id)?.status).to.equal("refunded");
      expect(byId.get(bet1.id)?.actualPayout).to.equal("1.50000000");
      expect(byId.get(bet2.id)?.actualPayout).to.equal("2.50000000");
    });

    it("rejects a refund on a market that has already been refunded", async function () {
      const market = await createMarket();
      await setMarketStatus(market.id, "refunded");

      const res = await fetch(`${server.url}/api/admin/markets/${market.id}/refund`, {
        method: "POST",
      });
      const body = await res.json();

      expect(res.status).to.equal(400);
      expect(body.message).to.match(/already been refunded/i);
    });
  });

  describe("POST /api/markets/:id/settle", function () {
    it("rejects settling a market that was already refunded", async function () {
      const market = await createMarket();
      await setMarketStatus(market.id, "refunded");

      const res = await fetch(`${server.url}/api/markets/${market.id}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winningOutcome: "A" }),
      });
      const body = await res.json();

      expect(res.status).to.equal(400);
      expect(body.message).to.match(/refunded/i);

      const reloaded = await storage.getMarketById(market.id);
      expect(reloaded?.status).to.equal("refunded");
      expect(reloaded?.winningOutcome).to.equal(null);
    });
  });

  describe("GET /api/admin/markets/:id/bets", function () {
    it("returns the market plus its bets and a pool summary", async function () {
      const market = await createMarket();
      await insertBet(market.id, { outcome: "A", amount: "1.00000000" });
      await insertBet(market.id, { outcome: "B", amount: "2.50000000" });
      await insertBet(market.id, { outcome: "A", amount: "0.50000000" });

      const res = await fetch(`${server.url}/api/admin/markets/${market.id}/bets`);
      const body = await res.json();

      expect(res.status).to.equal(200);
      expect(body.market.id).to.equal(market.id);
      expect(body.bets).to.have.length(3);
      expect(body.summary.totalBets).to.equal(3);
      expect(parseFloat(body.summary.totalA)).to.equal(1.5);
      expect(parseFloat(body.summary.totalB)).to.equal(2.5);
      expect(parseFloat(body.summary.totalPool)).to.equal(4.0);
    });

    it("returns 404 when the market does not exist", async function () {
      const missingId = randomUUID();

      const res = await fetch(`${server.url}/api/admin/markets/${missingId}/bets`);
      const body = await res.json();

      expect(res.status).to.equal(404);
      expect(body.message).to.equal("Market not found");
    });
  });
});
