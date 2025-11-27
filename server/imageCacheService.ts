import { db } from "./db";
import { cachedImages } from "@shared/schema";
import { eq, sql, and } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const CACHE_DIR = path.join(process.cwd(), "cached-images");

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

interface CacheResult {
  success: boolean;
  localPath?: string;
  contentType?: string;
  error?: string;
}

interface CacheOptions {
  category?: string;
  sportId?: string;
  leagueId?: string;
  teamId?: string;
}

function sanitizeFolderName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

function generateFileName(url: string, contentType?: string): string {
  const hash = crypto.createHash("md5").update(url).digest("hex");
  let ext = ".img";
  
  if (contentType) {
    const extMap: Record<string, string> = {
      "image/png": ".png",
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "image/svg+xml": ".svg",
    };
    ext = extMap[contentType] || ".img";
  } else {
    const urlExt = url.split(".").pop()?.toLowerCase().split("?")[0];
    if (urlExt && ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(urlExt)) {
      ext = `.${urlExt === "jpeg" ? "jpg" : urlExt}`;
    }
  }
  
  return `${hash}${ext}`;
}

function buildFolderPath(options: CacheOptions): string {
  const parts: string[] = [];
  
  if (options.sportId) {
    parts.push(sanitizeFolderName(options.sportId));
    
    if (options.leagueId) {
      parts.push(sanitizeFolderName(options.leagueId));
      
      if (options.teamId) {
        parts.push(sanitizeFolderName(options.teamId));
      }
    }
  }
  
  return parts.join('/');
}

export function ensureFolderExists(folderPath: string): void {
  const fullPath = path.join(CACHE_DIR, folderPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
}

export function createSportFolder(sportName: string): { success: boolean; folderPath: string; error?: string } {
  try {
    const folderName = sanitizeFolderName(sportName);
    const fullPath = path.join(CACHE_DIR, folderName);
    
    if (fs.existsSync(fullPath)) {
      return { success: false, folderPath: folderName, error: "Sport folder already exists" };
    }
    
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`[ImageCache] Created sport folder: ${folderName}`);
    
    return { success: true, folderPath: folderName };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[ImageCache] Failed to create sport folder:`, errorMessage);
    return { success: false, folderPath: "", error: errorMessage };
  }
}

export function createLeagueFolder(sportId: string, leagueName: string): { success: boolean; folderPath: string; error?: string } {
  try {
    const sportFolder = sanitizeFolderName(sportId);
    const leagueFolder = sanitizeFolderName(leagueName);
    const relativePath = `${sportFolder}/${leagueFolder}`;
    const fullPath = path.join(CACHE_DIR, relativePath);
    
    const sportPath = path.join(CACHE_DIR, sportFolder);
    if (!fs.existsSync(sportPath)) {
      fs.mkdirSync(sportPath, { recursive: true });
    }
    
    if (fs.existsSync(fullPath)) {
      return { success: false, folderPath: relativePath, error: "League folder already exists" };
    }
    
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`[ImageCache] Created league folder: ${relativePath}`);
    
    return { success: true, folderPath: relativePath };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[ImageCache] Failed to create league folder:`, errorMessage);
    return { success: false, folderPath: "", error: errorMessage };
  }
}

export function listSportFolders(): string[] {
  try {
    const items = fs.readdirSync(CACHE_DIR, { withFileTypes: true });
    return items
      .filter(item => item.isDirectory())
      .map(item => item.name);
  } catch (error) {
    console.error("Error listing sport folders:", error);
    return [];
  }
}

export function listLeagueFolders(sportId: string): string[] {
  try {
    const sportFolder = sanitizeFolderName(sportId);
    const sportPath = path.join(CACHE_DIR, sportFolder);
    
    if (!fs.existsSync(sportPath)) {
      return [];
    }
    
    const items = fs.readdirSync(sportPath, { withFileTypes: true });
    return items
      .filter(item => item.isDirectory())
      .map(item => item.name);
  } catch (error) {
    console.error("Error listing league folders:", error);
    return [];
  }
}

export async function getCachedImage(originalUrl: string): Promise<string | null> {
  try {
    const cached = await db.select().from(cachedImages).where(eq(cachedImages.originalUrl, originalUrl)).limit(1);
    
    if (cached.length > 0) {
      const record = cached[0];
      const fullPath = path.join(CACHE_DIR, record.localPath);
      
      if (fs.existsSync(fullPath)) {
        await db.update(cachedImages)
          .set({ 
            lastAccessed: new Date(),
            accessCount: sql`${cachedImages.accessCount} + 1`
          })
          .where(eq(cachedImages.id, record.id));
        
        return record.localPath;
      } else {
        await db.delete(cachedImages).where(eq(cachedImages.id, record.id));
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error checking cached image:", error);
    return null;
  }
}

export async function cacheImage(originalUrl: string, options: CacheOptions = {}): Promise<CacheResult> {
  try {
    const existingPath = await getCachedImage(originalUrl);
    if (existingPath) {
      return { 
        success: true, 
        localPath: existingPath,
        contentType: path.extname(existingPath).slice(1)
      };
    }

    console.log(`[ImageCache] Downloading: ${originalUrl}`);
    
    const response = await fetch(originalUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "image/*",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const contentType = response.headers.get("content-type") || undefined;
    const buffer = await response.arrayBuffer();
    const fileName = generateFileName(originalUrl, contentType);
    
    const folderPath = buildFolderPath(options);
    if (folderPath) {
      ensureFolderExists(folderPath);
    }
    
    const relativePath = folderPath ? `${folderPath}/${fileName}` : fileName;
    const fullPath = path.join(CACHE_DIR, relativePath);

    fs.writeFileSync(fullPath, Buffer.from(buffer));

    await db.insert(cachedImages).values({
      originalUrl,
      localPath: relativePath,
      contentType: contentType || null,
      fileSize: buffer.byteLength,
      category: options.category || 'general',
      sportId: options.sportId || null,
      leagueId: options.leagueId || null,
      teamId: options.teamId || null,
    });

    console.log(`[ImageCache] Cached: ${relativePath} (${buffer.byteLength} bytes)`);

    return { 
      success: true, 
      localPath: relativePath,
      contentType: contentType || undefined
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[ImageCache] Failed to cache ${originalUrl}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function getOrCacheImage(originalUrl: string, categoryOrOptions: string | CacheOptions = "general"): Promise<string | null> {
  const options: CacheOptions = typeof categoryOrOptions === 'string' 
    ? { category: categoryOrOptions }
    : categoryOrOptions;
    
  const existingPath = await getCachedImage(originalUrl);
  if (existingPath) {
    return existingPath;
  }

  const result = await cacheImage(originalUrl, options);
  return result.success ? result.localPath || null : null;
}

export function getCacheFilePath(localPath: string): string | null {
  if (localPath.includes("..")) {
    return null;
  }
  
  const fullPath = path.join(CACHE_DIR, localPath);
  if (fs.existsSync(fullPath)) {
    return fullPath;
  }
  return null;
}

export async function getCacheStats(): Promise<{
  totalImages: number;
  totalSize: number;
  byCategory: Record<string, number>;
  bySport: Record<string, number>;
}> {
  try {
    const images = await db.select().from(cachedImages);
    
    const stats = {
      totalImages: images.length,
      totalSize: images.reduce((sum, img) => sum + (img.fileSize || 0), 0),
      byCategory: {} as Record<string, number>,
      bySport: {} as Record<string, number>,
    };

    for (const img of images) {
      stats.byCategory[img.category] = (stats.byCategory[img.category] || 0) + 1;
      if (img.sportId) {
        stats.bySport[img.sportId] = (stats.bySport[img.sportId] || 0) + 1;
      }
    }

    return stats;
  } catch (error) {
    console.error("Error getting cache stats:", error);
    return { totalImages: 0, totalSize: 0, byCategory: {}, bySport: {} };
  }
}

export async function cleanupOldCache(maxAgeDays: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    const oldImages = await db.select()
      .from(cachedImages)
      .where(sql`${cachedImages.lastAccessed} < ${cutoffDate}`);

    let deletedCount = 0;
    for (const img of oldImages) {
      const fullPath = path.join(CACHE_DIR, img.localPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      await db.delete(cachedImages).where(eq(cachedImages.id, img.id));
      deletedCount++;
    }

    console.log(`[ImageCache] Cleaned up ${deletedCount} old cached images`);
    return deletedCount;
  } catch (error) {
    console.error("Error cleaning up cache:", error);
    return 0;
  }
}

export async function getImagesBySportLeague(sportId: string, leagueId?: string): Promise<Array<{
  id: string;
  originalUrl: string;
  localPath: string;
  teamId: string | null;
}>> {
  try {
    const conditions = [eq(cachedImages.sportId, sportId)];
    if (leagueId) {
      conditions.push(eq(cachedImages.leagueId, leagueId));
    }
    
    const images = await db.select({
      id: cachedImages.id,
      originalUrl: cachedImages.originalUrl,
      localPath: cachedImages.localPath,
      teamId: cachedImages.teamId,
    }).from(cachedImages).where(and(...conditions));
    
    return images;
  } catch (error) {
    console.error("Error getting images by sport/league:", error);
    return [];
  }
}
