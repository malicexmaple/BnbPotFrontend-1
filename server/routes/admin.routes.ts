import type { Express } from "express";
import type { RouteDeps } from "./types";

export function registerAdminRoutes(app: Express, deps: RouteDeps): void {
  const { storage, requireAuth, requireAdminRole } = deps;

  app.post("/api/admin/bootstrap", requireAuth, async (req, res) => {
    try {
      const walletAddress = req.session!.walletAddress!;

      const hasAdmin = await storage.hasAnyAdmin();
      if (hasAdmin) {
        return res.status(403).json({ message: "Admin already exists. Contact existing admin for access." });
      }

      const user = await storage.setUserRole(walletAddress, 'admin');
      if (!user) {
        return res.status(404).json({ message: "User not found. Please sign up first." });
      }

      req.session!.isAdmin = true;

      console.log(`👑 Admin bootstrapped: ${walletAddress}`);
      res.json({ success: true, message: "You are now an admin!", isAdmin: true });
    } catch (error) {
      console.error("Error bootstrapping admin:", error);
      res.status(500).json({ message: "Failed to bootstrap admin" });
    }
  });

  app.get("/api/admin/markets", requireAuth, requireAdminRole, async (_req, res) => {
    try {
      const allMarkets = await storage.getAllMarkets();
      res.json(allMarkets);
    } catch (error) {
      console.error("Error fetching admin markets:", error);
      res.status(500).json({ message: "Failed to fetch markets" });
    }
  });
}
