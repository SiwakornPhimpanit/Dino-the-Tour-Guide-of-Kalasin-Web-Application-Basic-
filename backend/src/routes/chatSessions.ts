import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { assertSessionOwner, createChatSession } from "../lib/chatPersistence.js";

export const chatSessionsRouter = Router();

chatSessionsRouter.use(requireAuth);

chatSessionsRouter.get("/sessions", async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.user!.sub;
    const result = await pool.query(
      `select id, title, created_at as "createdAt", updated_at as "updatedAt"
       from chat_sessions
       where user_id = $1
       order by updated_at desc
       limit 50`,
      [userId]
    );
    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

chatSessionsRouter.post("/sessions", async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.user!.sub;
    const title =
      typeof req.body?.title === "string" && req.body.title.trim()
        ? req.body.title.trim().slice(0, 255)
        : "การสนทนาใหม่";
    const id = await createChatSession(userId, title);
    const row = await pool.query(
      `select id, title, created_at as "createdAt", updated_at as "updatedAt"
       from chat_sessions where id = $1`,
      [id]
    );
    res.status(201).json({ data: row.rows[0] });
  } catch (err) {
    next(err);
  }
});

chatSessionsRouter.get("/sessions/:id/messages", async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.user!.sub;
    const sessionId = Number.parseInt(String(req.params.id), 10);
    if (!Number.isFinite(sessionId)) return res.status(400).json({ error: "INVALID_ID" });

    const ok = await assertSessionOwner(sessionId, userId);
    if (!ok) return res.status(404).json({ error: "NOT_FOUND" });

    const session = await pool.query(
      `select id, title, created_at as "createdAt", updated_at as "updatedAt"
       from chat_sessions where id = $1`,
      [sessionId]
    );
    const messages = await pool.query(
      `select role, content, created_at as "createdAt"
       from chat_messages
       where session_id = $1
       order by created_at asc`,
      [sessionId]
    );

    res.json({
      data: {
        session: session.rows[0],
        messages: messages.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

chatSessionsRouter.delete("/sessions/:id", async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.user!.sub;
    const sessionId = Number.parseInt(String(req.params.id), 10);
    if (!Number.isFinite(sessionId)) return res.status(400).json({ error: "INVALID_ID" });

    const result = await pool.query(
      `delete from chat_sessions where id = $1 and user_id = $2`,
      [sessionId, userId]
    );
    if (!result.rowCount) return res.status(404).json({ error: "NOT_FOUND" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
