import type { Express, Request, Response, NextFunction } from "express";
import type { IStorage } from "../storage";
import type { RateLimitMiddleware } from "../rateLimit";

export interface Realtime {
  broadcastRoundUpdate: (data: any) => void;
  broadcastChat: (data: any) => void;
}

export interface RateLimiters {
  auth: RateLimitMiddleware;
  api: RateLimitMiddleware;
  general: RateLimitMiddleware;
}

export type AuthMiddleware = (req: Request, res: Response, next: NextFunction) => void;

export interface RouteDeps {
  storage: IStorage;
  rateLimiters: RateLimiters;
  requireAuth: AuthMiddleware;
  requireTermsAgreement: AuthMiddleware;
  requireAdminRole: AuthMiddleware;
  realtime: Realtime;
}
