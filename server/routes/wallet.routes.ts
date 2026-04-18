import type { Express, Request, Response } from "express";
import { z } from "zod";
import { randomBytes } from "crypto";
import type { RouteDeps } from "./types";

const depositSchema = z.object({
  amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
});

const withdrawSchema = z.object({
  amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
  toAddress: z.string().min(10).max(100),
});

async function resolveUser(req: Request, storage: RouteDeps["storage"]) {
  const walletAddress = req.session?.walletAddress;
  if (!walletAddress) return null;
  return storage.getUserByWalletAddress(walletAddress);
}

async function ensureWallet(userId: string, storage: RouteDeps["storage"]) {
  let wallet = await storage.getWalletByUserId(userId);
  if (!wallet) {
    const bnbAddress = `0x${randomBytes(20).toString("hex")}`;
    wallet = await storage.createWallet({
      userId,
      bnbAddress,
      balance: "0",
    });
  }
  return wallet;
}

export function registerWalletRoutes(app: Express, deps: RouteDeps): void {
  const { storage, requireAuth } = deps;

  app.get("/api/wallet", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await resolveUser(req, storage);
      if (!user) return res.status(404).json({ message: "User not found" });
      const wallet = await ensureWallet(user.id, storage);
      res.json(wallet);
    } catch (err) {
      console.error("GET /api/wallet error", err);
      res.status(500).json({ message: "Failed to fetch wallet" });
    }
  });

  app.post("/api/wallet/deposit", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = depositSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid deposit amount" });
      }
      const amount = parsed.data.amount;
      if (parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid deposit amount" });
      }
      const user = await resolveUser(req, storage);
      if (!user) return res.status(404).json({ message: "User not found" });
      const wallet = await ensureWallet(user.id, storage);
      const newBalance = (parseFloat(wallet.balance) + parseFloat(amount)).toString();
      const updated = await storage.updateWalletBalance(wallet.id, newBalance);
      await storage.createTransaction({
        walletId: wallet.id,
        userId: user.id,
        type: "deposit",
        amount,
        status: "completed",
        txHash: `0x${randomBytes(32).toString("hex")}`,
        metadata: { method: "mock_deposit" },
      });
      res.json(updated);
    } catch (err) {
      console.error("POST /api/wallet/deposit error", err);
      res.status(500).json({ message: "Failed to process deposit" });
    }
  });

  app.post("/api/wallet/quick-deposit", requireAuth, async (req: Request, res: Response) => {
    try {
      const amount = "5";
      const user = await resolveUser(req, storage);
      if (!user) return res.status(404).json({ message: "User not found" });
      const wallet = await ensureWallet(user.id, storage);
      const newBalance = (parseFloat(wallet.balance) + parseFloat(amount)).toString();
      const updated = await storage.updateWalletBalance(wallet.id, newBalance);
      await storage.createTransaction({
        walletId: wallet.id,
        userId: user.id,
        type: "deposit",
        amount,
        status: "completed",
        txHash: `0x${randomBytes(32).toString("hex")}`,
        metadata: { method: "quick_deposit" },
      });
      res.json(updated);
    } catch (err) {
      console.error("POST /api/wallet/quick-deposit error", err);
      res.status(500).json({ message: "Failed to process quick deposit" });
    }
  });

  app.post("/api/wallet/withdraw", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = withdrawSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid withdrawal request",
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      const { amount, toAddress } = parsed.data;
      if (parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid withdrawal amount" });
      }
      const user = await resolveUser(req, storage);
      if (!user) return res.status(404).json({ message: "User not found" });
      const wallet = await storage.getWalletByUserId(user.id);
      if (!wallet) return res.status(404).json({ message: "Wallet not found" });
      const currentBalance = parseFloat(wallet.balance);
      if (currentBalance < parseFloat(amount)) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      const newBalance = (currentBalance - parseFloat(amount)).toString();
      const updated = await storage.updateWalletBalance(wallet.id, newBalance);
      await storage.createTransaction({
        walletId: wallet.id,
        userId: user.id,
        type: "withdrawal",
        amount,
        status: "completed",
        txHash: `0x${randomBytes(32).toString("hex")}`,
        metadata: { toAddress },
      });
      res.json(updated);
    } catch (err) {
      console.error("POST /api/wallet/withdraw error", err);
      res.status(500).json({ message: "Failed to process withdrawal" });
    }
  });

  app.get("/api/wallet/transactions", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await resolveUser(req, storage);
      if (!user) return res.status(404).json({ message: "User not found" });
      const txs = await storage.getUserTransactions(user.id, 100);
      res.json(txs);
    } catch (err) {
      console.error("GET /api/wallet/transactions error", err);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
}
