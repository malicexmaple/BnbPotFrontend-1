import type { Express } from "express";
import type { RouteDeps } from "./types";

export function registerUsersRoutes(app: Express, deps: RouteDeps): void {
  const { storage, requireAuth } = deps;

  app.get("/api/users/me", async (req, res) => {
    try {
      const { walletAddress } = req.query;
      if (!walletAddress || typeof walletAddress !== 'string') {
        return res.status(400).json({ message: "Wallet address required" });
      }

      const user = await storage.getUserByWalletAddress(walletAddress);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userData } = user;
      res.json(userData);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users/signup", requireAuth, async (req, res) => {
    try {
      const { username, email } = req.body;

      const walletAddress = req.session!.walletAddress!;

      if (!username) {
        return res.status(400).json({ message: "Username required" });
      }

      const user = await storage.createOrUpdateUserByWallet(walletAddress, username, email);

      if (req.session) {
        req.session.username = user.username;
        req.session.agreedToTerms = user.agreedToTerms;
      }

      const { password, ...userData } = user;
      res.json(userData);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });
}
