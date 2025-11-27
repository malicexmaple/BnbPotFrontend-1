import type { Express } from "express";
import type { RouteDeps } from "./types";
import { z } from "zod";
import { insertCustomLeagueSchema } from "@shared/schema";
import { createLeagueFolder } from "../imageCacheService";

const idParamSchema = z.object({
  id: z.string()
    .min(1, "ID is required")
    .uuid("Invalid ID format"),
});

const sportIdQuerySchema = z.object({
  sportId: z.string().max(100).optional(),
});

const createLeagueBodySchema = insertCustomLeagueSchema.extend({
  name: z.string()
    .min(1, "League name is required")
    .max(100, "League name too long")
    .trim()
    .transform(val => val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')),
});

const updateLeagueBodySchema = insertCustomLeagueSchema.partial();

export function registerCustomLeaguesRoutes(app: Express, deps: RouteDeps): void {
  const { storage, requireAuth, requireAdminRole } = deps;

  app.get("/api/sports/custom-leagues", async (req, res) => {
    try {
      const queryResult = sportIdQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        return res.status(400).json({ 
          message: "Invalid query parameters", 
          errors: queryResult.error.flatten().fieldErrors 
        });
      }

      const leagues = await storage.getCustomLeagues(queryResult.data.sportId);
      res.json(leagues);
    } catch (error) {
      console.error("Error fetching custom leagues:", error);
      res.status(500).json({ message: "Failed to fetch custom leagues" });
    }
  });

  app.get("/api/sports/custom-leagues/:id", async (req, res) => {
    try {
      const paramResult = idParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid league ID", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      const league = await storage.getCustomLeagueById(paramResult.data.id);
      if (!league) {
        return res.status(404).json({ message: "League not found" });
      }
      res.json(league);
    } catch (error) {
      console.error("Error fetching custom league:", error);
      res.status(500).json({ message: "Failed to fetch custom league" });
    }
  });

  app.post("/api/sports/custom-leagues", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const bodyResult = createLeagueBodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({ 
          message: "Invalid request body", 
          errors: bodyResult.error.flatten().fieldErrors 
        });
      }

      const { sportId, name, displayName, badgeUrl } = bodyResult.data;

      const folderResult = createLeagueFolder(sportId, name);
      const folderPath = folderResult.success ? folderResult.folderPath : null;

      const league = await storage.createCustomLeague({
        sportId,
        name,
        displayName,
        badgeUrl: badgeUrl || null,
        folderPath,
      });

      res.status(201).json({ 
        success: true, 
        league,
        folderCreated: folderResult.success,
        message: `League "${displayName}" created successfully`
      });
    } catch (error) {
      console.error("Error creating custom league:", error);
      res.status(500).json({ message: "Failed to create custom league" });
    }
  });

  app.patch("/api/sports/custom-leagues/:id", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const paramResult = idParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid league ID", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      const bodyResult = updateLeagueBodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({ 
          message: "Invalid request body", 
          errors: bodyResult.error.flatten().fieldErrors 
        });
      }

      const league = await storage.updateCustomLeague(paramResult.data.id, bodyResult.data);
      if (!league) {
        return res.status(404).json({ message: "League not found" });
      }
      res.json(league);
    } catch (error) {
      console.error("Error updating custom league:", error);
      res.status(500).json({ message: "Failed to update custom league" });
    }
  });

  app.delete("/api/sports/custom-leagues/:id", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const paramResult = idParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid league ID", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      const existing = await storage.getCustomLeagueById(paramResult.data.id);
      if (!existing) {
        return res.status(404).json({ message: "League not found" });
      }

      await storage.deleteCustomLeague(paramResult.data.id);
      res.json({ success: true, message: "League deleted successfully" });
    } catch (error) {
      console.error("Error deleting custom league:", error);
      res.status(500).json({ message: "Failed to delete custom league" });
    }
  });
}
