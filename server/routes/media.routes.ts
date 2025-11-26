import type { Express } from "express";
import type { RouteDeps } from "./types";
import { z } from "zod";
import * as path from "path";
import * as fs from "fs";
import { getCacheFilePath, getOrCacheImage } from "../imageCacheService";

const entityTypeEnum = z.enum(['team', 'player', 'league']);

const customMediaQuerySchema = z.object({
  entityType: entityTypeEnum.optional(),
});

const customMediaParamsSchema = z.object({
  entityType: entityTypeEnum,
  entityId: z.string()
    .min(1, "Entity ID is required")
    .max(100, "Entity ID too long"),
});

const uuidParamSchema = z.object({
  id: z.string()
    .min(1, "ID is required")
    .uuid("Invalid custom media ID format"),
});

const urlSchema = z.string()
  .url("Invalid URL format")
  .max(2048, "URL too long")
  .nullable()
  .optional();

const customMediaBodySchema = z.object({
  entityType: entityTypeEnum,
  entityId: z.string()
    .min(1, "Entity ID is required")
    .max(100, "Entity ID too long"),
  entityName: z.string()
    .min(1, "Entity name is required")
    .max(200, "Entity name too long")
    .trim(),
  logoUrl: urlSchema,
  photoUrl: urlSchema,
  thumbnailUrl: urlSchema,
  sportId: z.string().max(100).nullable().optional(),
  leagueId: z.string().max(100).nullable().optional(),
});

export function registerMediaRoutes(app: Express, deps: RouteDeps): void {
  const { storage, requireAuth, requireAdminRole } = deps;

  app.get("/api/sports/custom-media", async (req, res) => {
    try {
      const queryResult = customMediaQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        return res.status(400).json({ 
          message: "Invalid query parameters", 
          errors: queryResult.error.flatten().fieldErrors 
        });
      }

      const media = await storage.getCustomMedia(queryResult.data.entityType);
      res.json(media);
    } catch (error) {
      console.error("Error fetching custom media:", error);
      res.status(500).json({ message: "Failed to fetch custom media" });
    }
  });

  app.get("/api/sports/custom-media/:entityType/:entityId", async (req, res) => {
    try {
      const paramResult = customMediaParamsSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid parameters", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      const { entityType, entityId } = paramResult.data;
      const media = await storage.getCustomMediaByEntity(entityType, entityId);
      res.json(media || null);
    } catch (error) {
      console.error("Error fetching custom media by entity:", error);
      res.status(500).json({ message: "Failed to fetch custom media" });
    }
  });

  app.post("/api/sports/custom-media", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const bodyResult = customMediaBodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({ 
          message: "Invalid request body", 
          errors: bodyResult.error.flatten().fieldErrors 
        });
      }

      const { entityType, entityId, entityName, logoUrl, photoUrl, thumbnailUrl, sportId, leagueId } = bodyResult.data;

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
      const paramResult = uuidParamSchema.safeParse(req.params);
      if (!paramResult.success) {
        return res.status(400).json({ 
          message: "Invalid custom media ID", 
          errors: paramResult.error.flatten().fieldErrors 
        });
      }

      await storage.deleteCustomMedia(paramResult.data.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting custom media:", error);
      res.status(500).json({ message: "Failed to delete custom media" });
    }
  });

  /**
   * Serve cached images with proper browser caching headers
   * Caches images for 7 days with immutable flag for CDN optimization
   */
  app.get("/api/images/cached/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      
      // Validate filename to prevent path traversal
      if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
        return res.status(400).json({ message: "Invalid filename" });
      }
      
      const filePath = getCacheFilePath(filename);
      
      if (!filePath) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      // Determine content type from file extension
      const ext = path.extname(filename).toLowerCase();
      const contentTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.img': 'application/octet-stream',
      };
      
      const contentType = contentTypes[ext] || 'application/octet-stream';
      
      // Set aggressive browser caching headers
      // Cache for 7 days, immutable for CDN optimization
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      res.setHeader('ETag', `"${filename}"`);
      res.setHeader('Content-Type', contentType);
      
      // Send the file
      res.sendFile(filePath);
    } catch (error) {
      console.error("Error serving cached image:", error);
      res.status(500).json({ message: "Failed to serve image" });
    }
  });

  /**
   * Proxy endpoint that caches external images locally and serves them with caching headers
   * This avoids CORS issues and adds browser caching for external images
   */
  app.get("/api/images/proxy", async (req, res) => {
    try {
      const { url, category } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: "URL parameter required" });
      }
      
      // Validate URL format
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ message: "Invalid URL format" });
      }
      
      // Get or cache the image
      const cachedPath = await getOrCacheImage(url, typeof category === 'string' ? category : 'proxy');
      
      if (!cachedPath) {
        return res.status(502).json({ message: "Failed to fetch and cache image" });
      }
      
      const filePath = getCacheFilePath(cachedPath);
      
      if (!filePath) {
        return res.status(404).json({ message: "Cached image not found" });
      }
      
      // Determine content type from file extension
      const ext = path.extname(cachedPath).toLowerCase();
      const contentTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.img': 'application/octet-stream',
      };
      
      const contentType = contentTypes[ext] || 'application/octet-stream';
      
      // Set aggressive browser caching headers
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      res.setHeader('ETag', `"${cachedPath}"`);
      res.setHeader('Content-Type', contentType);
      
      // Send the file
      res.sendFile(filePath);
    } catch (error) {
      console.error("Error proxying image:", error);
      res.status(500).json({ message: "Failed to proxy image" });
    }
  });
}
