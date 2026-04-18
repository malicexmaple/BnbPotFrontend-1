import type { Express, Request, Response } from "express";
import type { RouteDeps } from "./types";

interface CachedPrices {
  data: any;
  fetchedAt: number;
}

let cache: CachedPrices | null = null;
const CACHE_TTL_MS = 60_000;

const FALLBACK = {
  bnb: { usd: 612.45, usd_24h_change: 1.23 },
  bitcoin: { usd: 67234.12, usd_24h_change: -0.42 },
  ethereum: { usd: 3567.89, usd_24h_change: 2.11 },
};

async function fetchPrices() {
  try {
    const url =
      "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin,bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true";
    const r = await fetch(url, { headers: { accept: "application/json" } });
    if (!r.ok) throw new Error(`coingecko ${r.status}`);
    const j: any = await r.json();
    return {
      bnb: { usd: j.binancecoin?.usd ?? FALLBACK.bnb.usd, usd_24h_change: j.binancecoin?.usd_24h_change ?? 0 },
      bitcoin: { usd: j.bitcoin?.usd ?? FALLBACK.bitcoin.usd, usd_24h_change: j.bitcoin?.usd_24h_change ?? 0 },
      ethereum: { usd: j.ethereum?.usd ?? FALLBACK.ethereum.usd, usd_24h_change: j.ethereum?.usd_24h_change ?? 0 },
    };
  } catch {
    return FALLBACK;
  }
}

export function registerCryptoRoutes(app: Express, _deps: RouteDeps): void {
  app.get("/api/crypto/prices", async (_req: Request, res: Response) => {
    try {
      const now = Date.now();
      if (!cache || now - cache.fetchedAt > CACHE_TTL_MS) {
        const data = await fetchPrices();
        cache = { data, fetchedAt: now };
      }
      res.set("Cache-Control", "public, max-age=30");
      res.json(cache.data);
    } catch (err) {
      console.error("GET /api/crypto/prices error", err);
      res.json(FALLBACK);
    }
  });
}
