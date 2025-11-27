import type { Express } from "express";
import type { RouteDeps } from "./types";
import { z } from "zod";
import * as path from "path";
import * as fs from "fs";
import { 
  getCacheFilePath, 
  getOrCacheImage, 
  createSportFolder, 
  createLeagueFolder,
  listSportFolders,
  listLeagueFolders,
  getImagesBySportLeague
} from "../imageCacheService";

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

const uploadMediaBodySchema = z.object({
  entityType: entityTypeEnum,
  entityId: z.string()
    .min(1, "Entity ID is required")
    .max(100, "Entity ID too long"),
  entityName: z.string()
    .min(1, "Entity name is required")
    .max(200, "Entity name too long")
    .trim(),
  sportId: z.string().max(100).optional().default(''),
  leagueId: z.string().max(100).optional().default(''),
  fileData: z.string()
    .min(1, "File data is required"),
  fileName: z.string()
    .min(1, "File name is required")
    .max(255, "File name too long"),
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
   * Upload media file with base64 data
   * Saves file to cache directory and creates custom media entry
   */
  app.post("/api/sports/upload-media", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const bodyResult = uploadMediaBodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({ 
          message: "Invalid request body", 
          errors: bodyResult.error.flatten().fieldErrors 
        });
      }

      const { entityType, entityId, entityName, sportId, leagueId, fileData, fileName } = bodyResult.data;

      const sanitizeForPath = (str: string): string => {
        return str.toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 50);
      };

      const base64Match = fileData.match(/^data:image\/(jpeg|jpg|png|gif|webp);base64,(.+)$/i);
      if (!base64Match) {
        return res.status(400).json({ message: "Invalid file data format. Expected base64 encoded JPEG, PNG, GIF, or WebP image." });
      }

      const [, imageType, base64Content] = base64Match;
      const buffer = Buffer.from(base64Content, 'base64');
      
      if (buffer.length > 2 * 1024 * 1024) {
        return res.status(400).json({ message: "File too large. Maximum size is 2MB." });
      }

      const sanitizedName = sanitizeForPath(entityName);
      const sanitizedEntityId = sanitizeForPath(entityId);
      const timestamp = Date.now();
      const normalizedImageType = imageType.toLowerCase() === 'jpg' ? 'jpeg' : imageType.toLowerCase();
      const savedFileName = `${sanitizedName}-${timestamp}.${normalizedImageType}`;
      
      let folderPath = 'uploads';
      if (sportId) {
        const sanitizedSportId = sanitizeForPath(sportId);
        folderPath = `uploads/${sanitizedSportId}`;
        if (leagueId) {
          const sanitizedLeagueId = sanitizeForPath(leagueId);
          folderPath = `${folderPath}/${sanitizedLeagueId}`;
        }
      }
      
      const baseCacheDir = path.join(process.cwd(), '.cache', 'images');
      if (!fs.existsSync(baseCacheDir)) {
        fs.mkdirSync(baseCacheDir, { recursive: true });
      }
      
      const cacheDir = path.join(baseCacheDir, folderPath);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      
      const filePath = path.join(cacheDir, savedFileName);
      
      try {
        await fs.promises.writeFile(filePath, buffer);
      } catch (writeError) {
        console.error("Error writing file:", writeError);
        return res.status(500).json({ message: "Failed to save uploaded file" });
      }
      
      const serveUrl = `/api/images/cached/${folderPath}/${savedFileName}`;
      
      const logoUrl = entityType === 'team' || entityType === 'league' ? serveUrl : null;
      const photoUrl = entityType === 'player' ? serveUrl : null;
      
      try {
        const media = await storage.upsertCustomMedia({
          entityType,
          entityId: sanitizedEntityId,
          entityName,
          logoUrl,
          photoUrl,
          thumbnailUrl: null,
          sportId: sportId || null,
          leagueId: leagueId || null
        });

        res.json({ 
          success: true, 
          media,
          localPath: filePath,
          serveUrl
        });
      } catch (storageError) {
        console.error("Error saving media to database:", storageError);
        try {
          await fs.promises.unlink(filePath);
        } catch (cleanupError) {
          console.error("Error cleaning up file after storage failure:", cleanupError);
        }
        return res.status(500).json({ message: "Failed to save media metadata" });
      }
    } catch (error) {
      console.error("Error uploading media:", error);
      res.status(500).json({ message: "Failed to upload media" });
    }
  });

  /**
   * Create a new sport folder in the image cache directory
   */
  app.post("/api/sports/folders", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const bodySchema = z.object({
        sportName: z.string()
          .min(1, "Sport name is required")
          .max(100, "Sport name too long")
          .trim(),
      });
      
      const bodyResult = bodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({ 
          message: "Invalid request body", 
          errors: bodyResult.error.flatten().fieldErrors 
        });
      }

      const { sportName } = bodyResult.data;
      const result = createSportFolder(sportName);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: result.error || "Failed to create sport folder",
          folderPath: result.folderPath
        });
      }
      
      res.json({ 
        success: true, 
        folderPath: result.folderPath,
        message: `Sport folder '${sportName}' created successfully`
      });
    } catch (error) {
      console.error("Error creating sport folder:", error);
      res.status(500).json({ message: "Failed to create sport folder" });
    }
  });

  /**
   * Create a new league folder within a sport
   */
  app.post("/api/sports/leagues", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const bodySchema = z.object({
        sportId: z.string()
          .min(1, "Sport ID is required")
          .max(100, "Sport ID too long"),
        leagueName: z.string()
          .min(1, "League name is required")
          .max(100, "League name too long")
          .trim(),
      });
      
      const bodyResult = bodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({ 
          message: "Invalid request body", 
          errors: bodyResult.error.flatten().fieldErrors 
        });
      }

      const { sportId, leagueName } = bodyResult.data;
      const result = createLeagueFolder(sportId, leagueName);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: result.error || "Failed to create league folder",
          folderPath: result.folderPath
        });
      }
      
      res.json({ 
        success: true, 
        folderPath: result.folderPath,
        message: `League folder '${leagueName}' created successfully`
      });
    } catch (error) {
      console.error("Error creating league folder:", error);
      res.status(500).json({ message: "Failed to create league folder" });
    }
  });

  /**
   * List all sport folders
   */
  app.get("/api/sports/folders", async (req, res) => {
    try {
      const folders = listSportFolders();
      res.json({ folders });
    } catch (error) {
      console.error("Error listing sport folders:", error);
      res.status(500).json({ message: "Failed to list sport folders" });
    }
  });

  /**
   * List league folders within a sport
   */
  app.get("/api/sports/folders/:sportId/leagues", async (req, res) => {
    try {
      const { sportId } = req.params;
      
      if (!sportId || sportId.length > 100) {
        return res.status(400).json({ message: "Invalid sport ID" });
      }
      
      const folders = listLeagueFolders(sportId);
      res.json({ folders });
    } catch (error) {
      console.error("Error listing league folders:", error);
      res.status(500).json({ message: "Failed to list league folders" });
    }
  });

  /**
   * Get cached images for a sport/league
   */
  app.get("/api/sports/folders/:sportId/images", async (req, res) => {
    try {
      const { sportId } = req.params;
      const { leagueId } = req.query;
      
      if (!sportId || sportId.length > 100) {
        return res.status(400).json({ message: "Invalid sport ID" });
      }
      
      const images = await getImagesBySportLeague(
        sportId, 
        typeof leagueId === 'string' ? leagueId : undefined
      );
      res.json({ images });
    } catch (error) {
      console.error("Error getting sport/league images:", error);
      res.status(500).json({ message: "Failed to get images" });
    }
  });

  /**
   * Cache an image to a specific sport/league folder
   */
  app.post("/api/images/cache", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const bodySchema = z.object({
        url: z.string().url("Invalid URL format"),
        sportId: z.string().max(100).optional(),
        leagueId: z.string().max(100).optional(),
        teamId: z.string().max(100).optional(),
        category: z.string().max(50).optional(),
      });
      
      const bodyResult = bodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({ 
          message: "Invalid request body", 
          errors: bodyResult.error.flatten().fieldErrors 
        });
      }

      const { url, sportId, leagueId, teamId, category } = bodyResult.data;
      
      const cachedPath = await getOrCacheImage(url, {
        sportId,
        leagueId,
        teamId,
        category: category || 'general',
      });
      
      if (!cachedPath) {
        return res.status(502).json({ message: "Failed to fetch and cache image" });
      }
      
      res.json({ 
        success: true, 
        localPath: cachedPath,
        serveUrl: `/api/images/cached/${encodeURIComponent(cachedPath)}`
      });
    } catch (error) {
      console.error("Error caching image:", error);
      res.status(500).json({ message: "Failed to cache image" });
    }
  });

  /**
   * Serve cached images with proper browser caching headers
   * Supports both flat filenames and hierarchical paths (sport/league/filename.png)
   * Caches images for 7 days with immutable flag for CDN optimization
   */
  app.get("/api/images/cached/*", async (req, res) => {
    try {
      const imagePath = (req.params as { 0?: string })[0] || "";
      
      // Validate path to prevent traversal attacks
      if (!imagePath || imagePath.includes("..")) {
        return res.status(400).json({ message: "Invalid path" });
      }
      
      // Decode the path (handles URL-encoded slashes)
      const decodedPath = decodeURIComponent(imagePath);
      
      const filePath = getCacheFilePath(decodedPath);
      
      if (!filePath) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      // Determine content type from file extension
      const ext = path.extname(decodedPath).toLowerCase();
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
      res.setHeader('ETag', `"${decodedPath}"`);
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
