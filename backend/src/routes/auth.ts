import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { signToken } from "../lib/jwt.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(128),
  displayName: z.string().min(1).max(120).optional(),
});

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

type UserRow = {
  id: number;
  email: string;
  displayName: string | null;
  role: "member" | "admin";
};

function toPublicUser(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    role: row.role,
  };
}

function issueAuthResponse(row: UserRow) {
  const token = signToken({ sub: row.id, email: row.email, role: row.role });
  return { token, user: toPublicUser(row) };
}

authRouter.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const email = body.email.trim().toLowerCase();
    const passwordHash = await hashPassword(body.password);
    const displayName = body.displayName?.trim() || email.split("@")[0];

    const insert = await pool.query<UserRow>(
      `insert into users (email, password_hash, display_name, role)
       values ($1, $2, $3, 'member')
       returning id, email, display_name as "displayName", role`,
      [email, passwordHash, displayName]
    );

    res.status(201).json({ data: issueAuthResponse(insert.rows[0]) });
  } catch (err: unknown) {
    const pg = err as { code?: string };
    if (pg.code === "23505") {
      return res.status(409).json({ error: "EMAIL_TAKEN", message: "อีเมลนี้ถูกใช้แล้ว" });
    }
    next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const email = body.email.trim().toLowerCase();

    const result = await pool.query<UserRow & { passwordHash: string }>(
      `select id, email, display_name as "displayName", role, password_hash as "passwordHash"
       from users where email = $1`,
      [email]
    );
    const row = result.rows[0];
    if (!row) {
      return res.status(401).json({ error: "INVALID_CREDENTIALS", message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const ok = await verifyPassword(body.password, row.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "INVALID_CREDENTIALS", message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    res.json({ data: issueAuthResponse(row) });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.user!.sub;
    const result = await pool.query<UserRow>(
      `select id, email, display_name as "displayName", role from users where id = $1`,
      [userId]
    );
    const row = result.rows[0];
    if (!row) return res.status(401).json({ error: "UNAUTHORIZED" });
    res.json({ data: toPublicUser(row) });
  } catch (err) {
    next(err);
  }
});
