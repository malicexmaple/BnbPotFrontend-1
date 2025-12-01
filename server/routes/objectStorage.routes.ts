import type { Express } from "express";
import type { RouteDeps } from "./types";
import { z } from "zod";
import { ObjectStorageService, ObjectNotFoundError } from "../objectStorage";

const uploadBodySchema = z.object({
  folder: z.enum(['avatars', 'teams', 'players', 'leagues', 'media']).default('media'),
});

const fileUploadSchema = z.object({
  folder: z.enum(['avatars', 'teams', 'players', 'leagues', 'media']).default('media'),
  filename: z.string().min(1).max(255),
  contentType: z.string().regex(/^image\/(jpeg|jpg|png|gif|webp)$/i).optional(),
  fileData: z.string().min(1),
});

export function registerObjectStorageRoutes(app: Express, deps: RouteDeps): void {
  const { requireAuth, requireAdminRole } = deps;

  app.get("/objects/*", async (req, res) => {
    try {
      const objectPath = `/objects/${(req.params as { 0?: string })[0] || ""}`;
      
      if (!objectPath || objectPath === "/objects/") {
        return res.status(400).json({ message: "Invalid object path" });
      }
      
      const objectStorageService = new ObjectStorageService();
      await objectStorageService.streamObject(objectPath, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ message: "Object not found" });
      }
      console.error("Error serving object:", error);
      res.status(500).json({ message: "Failed to serve object" });
    }
  });

  app.post("/api/objects/upload-url", requireAuth, async (req, res) => {
    try {
      if (!process.env.PRIVATE_OBJECT_DIR) {
        return res.status(503).json({ 
          message: "Object Storage is not configured. Please set up Object Storage in the Replit tools panel.",
          code: "OBJECT_STORAGE_NOT_CONFIGURED"
        });
      }

      const bodyResult = uploadBodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({ 
          message: "Invalid request body", 
          errors: bodyResult.error.flatten().fieldErrors 
        });
      }

      const { folder } = bodyResult.data;
      const objectStorageService = new ObjectStorageService();
      const { url, objectPath } = await objectStorageService.getObjectEntityUploadURL(folder);
      
      res.json({ uploadURL: url, objectPath });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  app.post("/api/objects/upload", requireAuth, async (req, res) => {
    try {
      if (!process.env.PRIVATE_OBJECT_DIR) {
        return res.status(503).json({ 
          message: "Object Storage is not configured. Please set up Object Storage in the Replit tools panel.",
          code: "OBJECT_STORAGE_NOT_CONFIGURED"
        });
      }

      const bodyResult = fileUploadSchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({ 
          message: "Invalid request body", 
          errors: bodyResult.error.flatten().fieldErrors 
        });
      }

      const { folder, filename, contentType, fileData } = bodyResult.data;

      const base64Match = fileData.match(/^data:image\/(jpeg|jpg|png|gif|webp);base64,(.+)$/i);
      if (!base64Match) {
        return res.status(400).json({ 
          message: "Invalid file data format. Expected base64 encoded JPEG, PNG, GIF, or WebP image." 
        });
      }

      const [, imageType, base64Content] = base64Match;
      const buffer = Buffer.from(base64Content, 'base64');
      
      if (buffer.length > 2 * 1024 * 1024) {
        return res.status(400).json({ message: "File too large. Maximum size is 2MB." });
      }

      const timestamp = Date.now();
      const sanitizedFilename = filename.replace(/[^a-z0-9-_.]/gi, '-').slice(0, 50);
      const normalizedImageType = imageType.toLowerCase() === 'jpg' ? 'jpeg' : imageType.toLowerCase();
      const finalFilename = `${sanitizedFilename}-${timestamp}.${normalizedImageType}`;
      const mimeType = contentType || `image/${normalizedImageType}`;

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.uploadBuffer(buffer, folder, finalFilename, mimeType);

      res.json({ 
        success: true, 
        objectPath,
        serveUrl: objectPath,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.post("/api/avatars/upload", requireAuth, async (req, res) => {
    try {
      const bodySchema = z.object({
        fileData: z.string().min(1),
      });
      
      const bodyResult = bodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({ 
          message: "Invalid request body", 
          errors: bodyResult.error.flatten().fieldErrors 
        });
      }

      const { fileData } = bodyResult.data;
      const walletAddress = req.session?.walletAddress;
      
      if (!walletAddress) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const base64Match = fileData.match(/^data:image\/(jpeg|jpg|png|gif|webp);base64,(.+)$/i);
      if (!base64Match) {
        return res.status(400).json({ 
          message: "Invalid file data format. Expected base64 encoded JPEG, PNG, GIF, or WebP image." 
        });
      }

      const [, imageType, base64Content] = base64Match;
      const buffer = Buffer.from(base64Content, 'base64');
      
      if (buffer.length > 2 * 1024 * 1024) {
        return res.status(400).json({ message: "File too large. Maximum size is 2MB." });
      }

      const { storage } = deps;
      
      if (!process.env.PRIVATE_OBJECT_DIR) {
        const updatedUser = await storage.updateUserProfile(walletAddress, { avatarUrl: fileData });
        
        return res.json({ 
          success: true, 
          avatarUrl: fileData,
          user: updatedUser ? { avatarUrl: updatedUser.avatarUrl } : undefined,
          storageMode: "database",
        });
      }

      const timestamp = Date.now();
      const sanitizedWallet = walletAddress.slice(2, 10).toLowerCase();
      const normalizedImageType = imageType.toLowerCase() === 'jpg' ? 'jpeg' : imageType.toLowerCase();
      const filename = `avatar-${sanitizedWallet}-${timestamp}.${normalizedImageType}`;
      const mimeType = `image/${normalizedImageType}`;

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.uploadBuffer(buffer, 'avatars', filename, mimeType);

      const updatedUser = await storage.updateUserProfile(walletAddress, { avatarUrl: objectPath });

      res.json({ 
        success: true, 
        objectPath,
        avatarUrl: objectPath,
        user: updatedUser ? { avatarUrl: updatedUser.avatarUrl } : undefined,
        storageMode: "objectStorage",
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      if (error.message?.includes("PRIVATE_OBJECT_DIR")) {
        return res.status(503).json({ 
          message: "Object Storage is not configured. Please set up Object Storage in the Replit tools panel.",
          code: "OBJECT_STORAGE_NOT_CONFIGURED"
        });
      }
      res.status(500).json({ message: "Failed to upload avatar" });
    }
  });

  app.post("/api/sports/upload-media-storage", requireAuth, requireAdminRole, async (req, res) => {
    try {
      if (!process.env.PRIVATE_OBJECT_DIR) {
        return res.status(503).json({ 
          message: "Object Storage is not configured. Please set up Object Storage in the Replit tools panel.",
          code: "OBJECT_STORAGE_NOT_CONFIGURED"
        });
      }

      const bodySchema = z.object({
        entityType: z.enum(['team', 'player', 'league']),
        entityId: z.string().min(1).max(100),
        entityName: z.string().min(1).max(200).trim(),
        fileData: z.string().min(1),
        sportId: z.string().max(100).optional().default(''),
        leagueId: z.string().max(100).optional().default(''),
      });
      
      const bodyResult = bodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({ 
          message: "Invalid request body", 
          errors: bodyResult.error.flatten().fieldErrors 
        });
      }

      const { entityType, entityId, entityName, fileData, sportId, leagueId } = bodyResult.data;

      const base64Match = fileData.match(/^data:image\/(jpeg|jpg|png|gif|webp);base64,(.+)$/i);
      if (!base64Match) {
        return res.status(400).json({ 
          message: "Invalid file data format. Expected base64 encoded JPEG, PNG, GIF, or WebP image." 
        });
      }

      const [, imageType, base64Content] = base64Match;
      const buffer = Buffer.from(base64Content, 'base64');
      
      if (buffer.length > 2 * 1024 * 1024) {
        return res.status(400).json({ message: "File too large. Maximum size is 2MB." });
      }

      const sanitizeForPath = (str: string): string => {
        return str.toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 50);
      };

      const timestamp = Date.now();
      const sanitizedName = sanitizeForPath(entityName);
      const normalizedImageType = imageType.toLowerCase() === 'jpg' ? 'jpeg' : imageType.toLowerCase();
      const filename = `${sanitizedName}-${timestamp}.${normalizedImageType}`;
      const mimeType = `image/${normalizedImageType}`;

      let folder = entityType === 'player' ? 'players' : entityType === 'league' ? 'leagues' : 'teams';
      if (sportId) {
        folder = `${folder}/${sanitizeForPath(sportId)}`;
        if (leagueId) {
          folder = `${folder}/${sanitizeForPath(leagueId)}`;
        }
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.uploadBuffer(buffer, folder, filename, mimeType);

      const logoUrl = entityType === 'team' || entityType === 'league' ? objectPath : null;
      const photoUrl = entityType === 'player' ? objectPath : null;

      const { storage } = deps;
      const media = await storage.upsertCustomMedia({
        entityType,
        entityId: sanitizeForPath(entityId),
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
        objectPath,
        serveUrl: objectPath,
      });
    } catch (error) {
      console.error("Error uploading sports media:", error);
      res.status(500).json({ message: "Failed to upload sports media" });
    }
  });
}
