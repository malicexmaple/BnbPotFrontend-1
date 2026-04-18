import type { Express } from "express";
import type { RouteDeps } from "./types";
import { generateAuthMessage } from "../auth";
import { randomBytes } from "crypto";
import { z } from "zod";

const walletAddressSchema = z.string()
  .min(1, "Wallet address is required")
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address format");

const nonceRequestSchema = z.object({
  walletAddress: walletAddressSchema,
});

const verifyRequestSchema = z.object({
  walletAddress: walletAddressSchema,
  signature: z.string()
    .min(1, "Signature is required")
    .max(500, "Signature too long")
    .regex(/^0x[a-fA-F0-9]+$/, "Invalid signature format"),
  message: z.string()
    .min(1, "Message is required")
    .max(1000, "Message too long"),
});

export function registerAuthRoutes(app: Express, deps: RouteDeps): void {
  const { storage, rateLimiters } = deps;

  app.post("/api/auth/nonce", rateLimiters.auth, async (req, res) => {
    try {
      const parseResult = nonceRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid request", 
          errors: parseResult.error.flatten().fieldErrors 
        });
      }

      const { walletAddress } = parseResult.data;

      const nonce = randomBytes(32).toString('hex');
      const message = generateAuthMessage(walletAddress, nonce);

      if (req.session) {
        req.session.pendingNonce = nonce;
        req.session.pendingWallet = walletAddress.toLowerCase();
      }

      res.json({ message, nonce });
    } catch (error) {
      console.error("Error generating nonce:", error);
      res.status(500).json({ message: "Failed to generate authentication challenge" });
    }
  });

  app.post("/api/auth/verify", rateLimiters.auth, async (req, res) => {
    try {
      const parseResult = verifyRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid request", 
          errors: parseResult.error.flatten().fieldErrors 
        });
      }

      const { walletAddress, signature, message } = parseResult.data;

      const pendingNonce = req.session?.pendingNonce;
      const pendingWallet = req.session?.pendingWallet;

      if (!pendingNonce || !pendingWallet) {
        return res.status(401).json({ message: "No pending authentication. Please request a new challenge." });
      }

      if (pendingWallet.toLowerCase() !== walletAddress.toLowerCase()) {
        return res.status(401).json({ message: "Wallet address mismatch" });
      }

      if (!message.includes(pendingNonce)) {
        return res.status(401).json({ message: "Invalid authentication challenge" });
      }

      const { verifyWalletSignature } = await import("../auth");
      const isValid = verifyWalletSignature(message, signature, walletAddress);

      if (!isValid) {
        return res.status(401).json({ message: "Invalid signature" });
      }

      const user = await storage.getUserByWalletAddress(walletAddress);

      const adminWallets = (process.env.ADMIN_WALLETS || '').toLowerCase().split(',').map(w => w.trim());
      const isAdmin = adminWallets.includes(walletAddress.toLowerCase());

      if (req.session) {
        req.session.walletAddress = walletAddress.toLowerCase();
        req.session.username = user?.username;
        req.session.agreedToTerms = user?.agreedToTerms || false;
        req.session.isAdmin = isAdmin;

        delete req.session.pendingNonce;
        delete req.session.pendingWallet;
      }

      res.json({
        success: true,
        walletAddress: walletAddress.toLowerCase(),
        username: user?.username,
        agreedToTerms: user?.agreedToTerms || false,
        isAdmin
      });
    } catch (error) {
      console.error("Error verifying signature:", error);
      res.status(500).json({ message: "Failed to verify signature" });
    }
  });

  app.get("/api/auth/session", async (req, res) => {
    if (!req.session?.walletAddress) {
      return res.status(401).json({ authenticated: false });
    }

    const user = await storage.getUserByWalletAddress(req.session.walletAddress);

    const adminWallets = (process.env.ADMIN_WALLETS || '').toLowerCase().split(',').map(w => w.trim());
    const isEnvAdmin = adminWallets.includes(req.session.walletAddress.toLowerCase());
    const isDevEnv = process.env.NODE_ENV !== 'production';
    const hasDevAdminSession = isDevEnv && req.session.isAdmin === true;
    const isAdmin = isEnvAdmin || hasDevAdminSession;

    if (req.session) {
      req.session.isAdmin = isAdmin;
    }

    res.json({
      authenticated: true,
      walletAddress: req.session.walletAddress,
      username: user?.username,
      agreedToTerms: user?.agreedToTerms || false,
      isAdmin
    });
  });

  app.post("/api/auth/logout", async (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/dev-enabled", async (_req, res) => {
    const isDev = process.env.NODE_ENV !== 'production';
    res.json({ enabled: isDev });
  });

  app.post("/api/auth/dev-admin", async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: "Dev admin not available in production" });
      }

      const devWallet = "0x0000000000000000000000000000000000000001";

      if (req.session) {
        req.session.walletAddress = devWallet;
        req.session.username = "DevAdmin";
        req.session.agreedToTerms = true;
        req.session.isAdmin = true;
      }

      console.log("🔧 Dev admin login activated");
      res.json({
        success: true,
        walletAddress: devWallet,
        username: "DevAdmin",
        agreedToTerms: true,
        isAdmin: true
      });
    } catch (error) {
      console.error("Error with dev admin login:", error);
      res.status(500).json({ message: "Failed to activate dev admin" });
    }
  });
}
