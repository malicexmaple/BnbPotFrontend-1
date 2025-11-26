import type { Express } from "express";
import type { RouteDeps } from "./types";

export function registerMediaRoutes(app: Express, deps: RouteDeps): void {
  const { storage, requireAuth, requireAdminRole } = deps;

  app.get("/api/sports/custom-media", async (req, res) => {
    try {
      const entityType = req.query.entityType as string | undefined;
      const media = await storage.getCustomMedia(entityType);
      res.json(media);
    } catch (error) {
      console.error("Error fetching custom media:", error);
      res.status(500).json({ message: "Failed to fetch custom media" });
    }
  });

  app.get("/api/sports/custom-media/:entityType/:entityId", async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const media = await storage.getCustomMediaByEntity(entityType, entityId);
      res.json(media || null);
    } catch (error) {
      console.error("Error fetching custom media by entity:", error);
      res.status(500).json({ message: "Failed to fetch custom media" });
    }
  });

  app.post("/api/sports/custom-media", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const { entityType, entityId, entityName, logoUrl, photoUrl, thumbnailUrl, sportId, leagueId } = req.body;

      if (!entityType || !entityId || !entityName) {
        return res.status(400).json({ message: "entityType, entityId, and entityName are required" });
      }

      const media = await storage.upsertCustomMedia({
        entityType,
        entityId,
        entityName,
        logoUrl: logoUrl || null,
        photoUrl: photoUrl || null,
        thumbnailUrl: thumbnailUrl || null,
        sportId: sportId || null,
        leagueId: leagueId || null
      });
      res.json(media);
    } catch (error) {
      console.error("Error upserting custom media:", error);
      res.status(500).json({ message: "Failed to save custom media" });
    }
  });

  app.delete("/api/sports/custom-media/:id", requireAuth, requireAdminRole, async (req, res) => {
    try {
      await storage.deleteCustomMedia(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting custom media:", error);
      res.status(500).json({ message: "Failed to delete custom media" });
    }
  });
}
