import jwt from "jsonwebtoken";

export type AuthTokenPayload = {
  sub: number;
  email: string;
  role: "member" | "admin";
};

function secret(): string {
  const s = process.env.JWT_SECRET?.trim();
  if (!s) throw new Error("JWT_SECRET is not configured");
  return s;
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, secret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, secret());
  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("INVALID_TOKEN");
  }
  const rec = decoded as Record<string, unknown>;
  const sub = Number(rec.sub);
  const email = String(rec.email ?? "");
  const role = rec.role === "admin" ? "admin" : "member";
  if (!Number.isFinite(sub) || !email) throw new Error("INVALID_TOKEN");
  return { sub, email, role };
}
