import type { Express } from "express";
import type { RouteDeps } from "./types";
import { z } from "zod";

const walletAddressQuerySchema = z.object({
  walletAddress: z.string()
    .min(1, "Wallet address is required")
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address format"),
});

const signupSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be 30 characters or less")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
    .trim(),
  email: z.string()
    .email("Invalid email address")
    .max(255, "Email must be 255 characters or less")
    .optional()
    .or(z.literal('')),
});

const updateProfileSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be 30 characters or less")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
    .trim()
    .optional(),
  email: z.string()
    .email("Invalid email address")
    .max(255, "Email must be 255 characters or less")
    .optional()
    .or(z.literal('')),
});

export function registerUsersRoutes(app: Express, deps: RouteDeps): void {
  const { storage, requireAuth } = deps;

  app.get("/api/users/me", async (req, res) => {
    try {
      const queryResult = walletAddressQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        return res.status(400).json({ 
          message: "Invalid wallet address", 
          errors: queryResult.error.flatten().fieldErrors 
        });
      }

      const user = await storage.getUserByWalletAddress(queryResult.data.walletAddress);
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
      const bodyResult = signupSchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({ 
          message: "Invalid signup data", 
          errors: bodyResult.error.flatten().fieldErrors 
        });
      }

      const { username, email } = bodyResult.data;
      const walletAddress = req.session!.walletAddress!;

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

  // Update user profile
  app.patch("/api/users/profile", requireAuth, async (req, res) => {
    try {
      const bodyResult = updateProfileSchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({ 
          message: "Invalid profile data", 
          errors: bodyResult.error.flatten().fieldErrors 
        });
      }

      const walletAddress = req.session!.walletAddress!;
      const existingUser = await storage.getUserByWalletAddress(walletAddress);
      
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { username, email } = bodyResult.data;
      
      // Use provided values or keep existing
      const updatedUser = await storage.createOrUpdateUserByWallet(
        walletAddress, 
        username || existingUser.username,
        email !== undefined ? email : existingUser.email || undefined
      );

      if (req.session && username) {
        req.session.username = updatedUser.username;
      }

      const { password, ...userData } = updatedUser;
      res.json(userData);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
}
