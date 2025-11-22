import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { db } from "@shared/db";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { gameService } from "./gameService";
import { validateEnvironment } from "./env";
import { handleError } from "./errors";

// SECURITY: Validate all required environment variables before startup
validateEnvironment();

const app = express();

// SECURITY: Configure Express to trust first proxy for accurate IP detection
// This enables req.ip to correctly parse X-Forwarded-For when behind Replit's proxy
// Set to 1 to trust only the first proxy hop (most secure for single-proxy setups)
app.set('trust proxy', 1);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// Production-ready PostgreSQL session store
const PgSession = connectPgSimple(session);

// Session configuration for production-ready authentication
const sessionMiddleware = session({
  store: new PgSession({
    conObject: {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
    },
    tableName: 'user_sessions', // Custom table name
    createTableIfMissing: true, // Auto-create session table
    pruneSessionInterval: 60 * 15 // Clean expired sessions every 15 minutes
  }),
  secret: process.env.SESSION_SECRET || 'bnbpot-dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS attacks
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict' // CSRF protection
  }
});

app.use(sessionMiddleware);

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// SECURITY: Add comprehensive security headers (2025 best practices)
app.use((_req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Prevent clickjacking attacks (legacy support + modern CSP frame-ancestors)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // Prevent MIME type sniffing that could lead to XSS
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Control how much referrer information is sent
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Prevent information leakage about the server
  res.setHeader('X-Powered-By', 'BNBPOT');
  
  // Permissions-Policy: Disable dangerous browser features
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  
  // Content Security Policy - Defense against XSS and injection attacks
  // Build environment-specific CSP directives
  const cspDirectives = [
    "default-src 'self'",
    // Development: unsafe-eval needed for Vite HMR; Production: strict
    `script-src 'self' ${isProduction ? '' : "'unsafe-eval'"}`,
    // Development: unsafe-inline for Vite HMR styles; Production: no inline styles
    `style-src 'self' ${isProduction ? '' : "'unsafe-inline'"} https://fonts.googleapis.com`,
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    // SECURITY: Restrict WebSocket connections to prevent data exfiltration
    // Development: Allow localhost WebSocket for Vite HMR
    // Production: Only allow same-origin WebSocket connections
    isProduction 
      ? "connect-src 'self'" // Production: only same-origin connections (includes wss: to same origin)
      : "connect-src 'self' ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:*",
    // Modern clickjacking protection (X-Frame-Options fallback for legacy browsers)
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].filter(Boolean); // Remove empty strings
  
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
  
  // HSTS: Force HTTPS in production (31536000 = 1 year)
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app, sessionMiddleware);

  // SECURITY: Centralized error handling with structured logging
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    // Use centralized error handler for consistent logging and responses
    handleError(err, res, `${req.method} ${req.path}`);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    log(`serving on port ${port}`);
    
    // Initialize game service (round lifecycle, blockchain sync)
    await gameService.initialize();
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    gameService.shutdown();
    server.close();
  });
})();
