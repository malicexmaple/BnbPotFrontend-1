import { db } from "./db";
import { cachedImages } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
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

export async function cacheImage(originalUrl: string, category: string = "general"): Promise<CacheResult> {
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
    const fullPath = path.join(CACHE_DIR, fileName);

    fs.writeFileSync(fullPath, Buffer.from(buffer));

    await db.insert(cachedImages).values({
      originalUrl,
      localPath: fileName,
      contentType: contentType || null,
      fileSize: buffer.byteLength,
      category,
    });

    console.log(`[ImageCache] Cached: ${fileName} (${buffer.byteLength} bytes)`);

    return { 
      success: true, 
      localPath: fileName,
      contentType: contentType || undefined
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[ImageCache] Failed to cache ${originalUrl}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function getOrCacheImage(originalUrl: string, category: string = "general"): Promise<string | null> {
  const existingPath = await getCachedImage(originalUrl);
  if (existingPath) {
    return existingPath;
  }

  const result = await cacheImage(originalUrl, category);
  return result.success ? result.localPath || null : null;
}

export function getCacheFilePath(localPath: string): string | null {
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
}> {
  try {
    const images = await db.select().from(cachedImages);
    
    const stats = {
      totalImages: images.length,
      totalSize: images.reduce((sum, img) => sum + (img.fileSize || 0), 0),
      byCategory: {} as Record<string, number>,
    };

    for (const img of images) {
      stats.byCategory[img.category] = (stats.byCategory[img.category] || 0) + 1;
    }

    return stats;
  } catch (error) {
    console.error("Error getting cache stats:", error);
    return { totalImages: 0, totalSize: 0, byCategory: {} };
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
