import { pool } from "../db/pool.js";

export function sessionTitleFromMessage(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= 60) return t || "การสนทนาใหม่";
  return `${t.slice(0, 57)}…`;
}

export async function assertSessionOwner(sessionId: number, userId: number): Promise<boolean> {
  const r = await pool.query<{ id: number }>(
    `select id from chat_sessions where id = $1 and user_id = $2`,
    [sessionId, userId]
  );
  return Boolean(r.rows[0]);
}

export async function createChatSession(userId: number, title: string): Promise<number> {
  const r = await pool.query<{ id: number }>(
    `insert into chat_sessions (user_id, title) values ($1, $2) returning id`,
    [userId, title]
  );
  return r.rows[0].id;
}

export async function touchSession(sessionId: number): Promise<void> {
  await pool.query(`update chat_sessions set updated_at = now() where id = $1`, [sessionId]);
}

export async function insertChatMessage(
  sessionId: number,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  await pool.query(
    `insert into chat_messages (session_id, role, content) values ($1, $2, $3)`,
    [sessionId, role, content]
  );
}

export async function resolveSessionForChat(
  userId: number,
  sessionId: number | null | undefined,
  firstUserMessage: string
): Promise<number> {
  if (sessionId != null) {
    const ok = await assertSessionOwner(sessionId, userId);
    if (!ok) throw new Error("SESSION_NOT_FOUND");
    return sessionId;
  }
  return createChatSession(userId, sessionTitleFromMessage(firstUserMessage));
}
