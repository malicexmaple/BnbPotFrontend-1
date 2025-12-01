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
  avatarUrl: z.string()
    .max(500000, "Avatar URL too large (max 500KB)")
    .optional()
    .or(z.literal('')),
  clientSeed: z.string()
    .min(16, "Client seed must be at least 16 characters")
    .max(128, "Client seed must be 128 characters or less")
    .regex(/^[a-zA-Z0-9]+$/, "Client seed can only contain alphanumeric characters")
    .optional(),
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

  // Get user avatar by username (public endpoint for chat/stats display)
  app.get("/api/users/avatar/:username", async (req, res) => {
    try {
      const { username } = req.params;
      if (!username || username.length < 1) {
        return res.status(400).json({ message: "Username is required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ avatarUrl: null });
      }

      res.json({ avatarUrl: user.avatarUrl || null });
    } catch (error) {
      console.error("Error fetching user avatar:", error);
      res.status(500).json({ message: "Failed to fetch user avatar" });
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

      const { username, email, avatarUrl, clientSeed } = bodyResult.data;
      
      // Build update object with only provided fields
      const updateData: { username?: string; email?: string; avatarUrl?: string; clientSeed?: string } = {};
      
      if (username !== undefined) updateData.username = username;
      if (email !== undefined) updateData.email = email || undefined;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl || undefined;
      if (clientSeed !== undefined) updateData.clientSeed = clientSeed;

      const updatedUser = await storage.updateUserProfile(walletAddress, updateData);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

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
