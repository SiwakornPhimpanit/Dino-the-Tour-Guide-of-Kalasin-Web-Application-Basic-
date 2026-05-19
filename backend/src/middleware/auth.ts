import type { Request, Response, NextFunction } from "express";
import { verifyToken, type AuthTokenPayload } from "../lib/jwt.js";

export type AuthedRequest = Request & { user?: AuthTokenPayload };

function bearerToken(req: Request): string | null {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const token = bearerToken(req);
  if (!token) return next();
  try {
    req.user = verifyToken(token);
  } catch {
    /* guest */
  }
  next();
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = bearerToken(req);
  if (!token) return res.status(401).json({ error: "UNAUTHORIZED" });
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "FORBIDDEN" });
    }
    next();
  });
}
