import { Request, Response, NextFunction } from "express";

/**
 * Improved in-memory rate limiter with per-limiter isolation
 * Tracks requests by IP+route and enforces rate limits
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests per window
  message?: string; // Error message when limit exceeded
  keyPrefix: string; // Unique prefix to isolate this limiter
}

interface RequestRecord {
  count: number;
  resetTime: number;
  lastAccess: number; // For LRU eviction
}

// Maximum entries per store to prevent memory exhaustion
const MAX_STORE_SIZE = 10000;

/**
 * Validate if a string is a valid IP address (IPv4 or IPv6)
 */
function isValidIP(ip: string): boolean {
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 pattern (simplified - covers most cases)
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  
  if (ipv4Pattern.test(ip)) {
    // Validate each octet is 0-255
    const octets = ip.split('.');
    return octets.every(octet => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  }
  
  return ipv6Pattern.test(ip) || ip === '::1' || ip === '::';
}

/**
 * Normalize IP address (handle IPv6-mapped IPv4, localhost aliases)
 */
function normalizeIP(ip: string): string {
  // Normalize IPv6-mapped IPv4 addresses (::ffff:192.168.1.1 -> 192.168.1.1)
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  
  // Normalize IPv6 localhost to standard form
  if (ip === '::1') {
    return '127.0.0.1';
  }
  
  // Normalize IPv4 localhost variations
  if (ip === '::' || ip === '0.0.0.0') {
    return '127.0.0.1';
  }
  
  return ip;
}

/**
 * Get client IP with secure proxy header support
 * SECURITY: Relies on Express's req.ip which correctly handles trust proxy
 * Express automatically parses X-Forwarded-For based on trust proxy setting
 * and returns the first untrusted IP, preventing spoofing attacks
 */
function getClientIP(req: Request): string {
  // SECURITY: Use Express's req.ip which already handles trust proxy correctly
  // When trust proxy is enabled, Express parses X-Forwarded-For from right to left
  // and returns the first IP that is not a trusted proxy, preventing spoofing
  let ip = req.ip || req.socket.remoteAddress || 'unknown';
  
  // Validate the IP to ensure it's properly formed
  if (ip !== 'unknown' && !isValidIP(ip)) {
    console.warn(`⚠️ Invalid IP detected from Express: ${ip}, falling back to socket`);
    ip = req.socket.remoteAddress || 'unknown';
  }
  
  // Normalize the IP address (handle IPv6-mapped IPv4, localhost aliases)
  return normalizeIP(ip);
}

/**
 * LRU eviction - remove oldest entries when store is full
 */
function evictOldest(store: Map<string, RequestRecord>, targetSize: number): void {
  if (store.size <= targetSize) return;
  
  const entries = Array.from(store.entries());
  entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);
  
  const toRemove = entries.slice(0, store.size - targetSize);
  for (const [key] of toRemove) {
    store.delete(key);
  }
}

/**
 * Create a rate limiting middleware with isolated storage
 * @param config Rate limit configuration
 * @returns Express middleware
 */
export function createRateLimiter(config: RateLimitConfig) {
  // Each limiter gets its own isolated store
  const requestStore = new Map<string, RequestRecord>();
  
  // Cleanup old entries every 5 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    
    requestStore.forEach((record, key) => {
      if (now > record.resetTime) {
        requestStore.delete(key);
        cleaned++;
      }
    });
    
    if (cleaned > 0) {
      console.log(`🧹 Rate limiter ${config.keyPrefix}: cleaned ${cleaned} expired entries`);
    }
    
    // Also enforce max size
    if (requestStore.size > MAX_STORE_SIZE) {
      evictOldest(requestStore, Math.floor(MAX_STORE_SIZE * 0.9));
      console.warn(`⚠️ Rate limiter ${config.keyPrefix}: evicted LRU entries (size: ${requestStore.size})`);
    }
  }, 5 * 60 * 1000);
  
  // Cleanup on process exit
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Get client IP with proxy support
    const ip = getClientIP(req);
    
    // Create unique key: prefix + IP + route (isolates by endpoint)
    const key = `${config.keyPrefix}:${ip}:${req.path}`;
    
    const now = Date.now();
    const record = requestStore.get(key);
    
    if (!record || now > record.resetTime) {
      // First request or window expired - reset
      requestStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
        lastAccess: now
      });
      return next();
    }
    
    // Update last access for LRU
    record.lastAccess = now;
    
    if (record.count >= config.max) {
      // Rate limit exceeded
      const resetIn = Math.ceil((record.resetTime - now) / 1000);
      res.status(429).json({
        message: config.message || "Too many requests, please try again later.",
        retryAfter: resetIn
      });
      
      console.warn(`⚠️ Rate limit exceeded: IP ${ip} on ${req.path} (limiter: ${config.keyPrefix})`);
      return;
    }
    
    // Increment count
    record.count++;
    next();
  };
}

/**
 * Rate limiter middleware type
 */
export type RateLimitMiddleware = ReturnType<typeof createRateLimiter>;

/**
 * Pre-configured rate limiters for common use cases
 * Each has isolated storage to prevent cross-contamination
 */
export const rateLimiters = {
  // Strict limiter for authentication endpoints
  auth: createRateLimiter({
    keyPrefix: 'auth',
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per window
    message: "Too many authentication attempts. Please try again later."
  }),
  
  // Moderate limiter for API endpoints
  api: createRateLimiter({
    keyPrefix: 'api',
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per window
    message: "Too many requests. Please slow down."
  }),
  
  // Lenient limiter for general use
  general: createRateLimiter({
    keyPrefix: 'general',
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 300, // 300 requests per window
    message: "Rate limit exceeded. Please try again shortly."
  })
};
