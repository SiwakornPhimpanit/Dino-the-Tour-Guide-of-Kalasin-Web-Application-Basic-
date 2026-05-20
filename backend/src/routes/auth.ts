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

const updateProfileSchema = z
  .object({
    email: z.string().email().max(255).optional(),
    displayName: z.string().min(1).max(120).optional(),
    currentPassword: z.string().min(1).max(128).optional(),
    newPassword: z.string().min(6).max(128).optional(),
  })
  .refine(
    (data) => {
      const hasNew = data.newPassword != null && data.newPassword.length > 0;
      const hasCurrent = data.currentPassword != null && data.currentPassword.length > 0;
      if (hasNew && !hasCurrent) return false;
      if (hasCurrent && !hasNew) return false;
      return true;
    },
    { message: "PASSWORD_PAIR_REQUIRED" }
  );

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

const userSelect = `id, email, display_name as "displayName", role`;

async function isEmailTaken(email: string, excludeUserId?: number): Promise<boolean> {
  const result = await pool.query<{ id: number }>(
    excludeUserId != null
      ? `select id from users where lower(email) = $1 and id <> $2 limit 1`
      : `select id from users where lower(email) = $1 limit 1`,
    excludeUserId != null ? [email, excludeUserId] : [email]
  );
  return result.rows.length > 0;
}

authRouter.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const email = body.email.trim().toLowerCase();
    const displayName = body.displayName?.trim() || email.split("@")[0];

    if (await isEmailTaken(email)) {
      return res.status(409).json({ error: "EMAIL_TAKEN", message: "อีเมลนี้ถูกใช้แล้ว" });
    }

    const passwordHash = await hashPassword(body.password);

    const insert = await pool.query<UserRow>(
      `insert into users (email, password_hash, display_name, role)
       values ($1, $2, $3, 'member')
       returning ${userSelect}`,
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
      `select ${userSelect}, password_hash as "passwordHash" from users where email = $1`,
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
    const result = await pool.query<UserRow>(`select ${userSelect} from users where id = $1`, [userId]);
    const row = result.rows[0];
    if (!row) return res.status(401).json({ error: "UNAUTHORIZED" });
    res.json({ data: toPublicUser(row) });
  } catch (err) {
    next(err);
  }
});

authRouter.patch("/me", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const body = updateProfileSchema.parse(req.body);
    const userId = req.user!.sub;

    const existing = await pool.query<UserRow & { passwordHash: string }>(
      `select ${userSelect}, password_hash as "passwordHash" from users where id = $1`,
      [userId]
    );
    const row = existing.rows[0];
    if (!row) return res.status(401).json({ error: "UNAUTHORIZED" });

    if (body.newPassword) {
      const ok = await verifyPassword(body.currentPassword!, row.passwordHash);
      if (!ok) {
        return res.status(400).json({ error: "WRONG_PASSWORD", message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
      }
      const sameAsCurrent = await verifyPassword(body.newPassword, row.passwordHash);
      if (sameAsCurrent) {
        return res.status(400).json({
          error: "SAME_PASSWORD",
          message: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน",
        });
      }
    }

    const email =
      body.email !== undefined ? body.email.trim().toLowerCase() : row.email;
    if (email !== row.email && (await isEmailTaken(email, userId))) {
      return res.status(409).json({ error: "EMAIL_TAKEN", message: "อีเมลนี้ถูกใช้แล้ว" });
    }

    const displayName =
      body.displayName !== undefined ? body.displayName.trim() : row.displayName;
    const passwordHash = body.newPassword ? await hashPassword(body.newPassword) : null;

    const updated = await pool.query<UserRow>(
      `update users
       set email = $1,
           display_name = $2,
           password_hash = coalesce($3, password_hash)
       where id = $4
       returning ${userSelect}`,
      [email, displayName, passwordHash, userId]
    );

    res.json({ data: issueAuthResponse(updated.rows[0]) });
  } catch (err) {
    next(err);
  }
});
