import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import {
  buildSystemPrompt,
  loadTravelKnowledgeContext,
  placeNamesAlreadyRecommended,
  restaurantsForMenuQuery,
} from "../lib/chatContext.js";
import {
  insertChatMessage,
  resolveSessionForChat,
  touchSession,
} from "../lib/chatPersistence.js";
import { optionalAuth, type AuthedRequest } from "../middleware/auth.js";

const OPENAI_MODEL_DEFAULT = "gpt-4o-mini";

const bodySchema = z.object({
  sessionId: z.number().int().positive().optional().nullable(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(8000),
      })
    )
    .min(1)
    .max(30),
});

async function pipeOpenAiStreamToClient(
  body: ReadableStream<Uint8Array>,
  res: Response
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let lineBuf = "";
  let sawDone = false;
  let fullText = "";

  while (!sawDone) {
    const { done, value } = await reader.read();
    if (done) break;
    lineBuf += decoder.decode(value, { stream: true });
    const lines = lineBuf.split("\n");
    lineBuf = lines.pop() ?? "";

    for (const rawLine of lines) {
      const line = rawLine.replace(/\r$/, "").trim();
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") {
        sawDone = true;
        break;
      }
      let json: unknown;
      try {
        json = JSON.parse(data);
      } catch {
        continue;
      }
      const rec = json as { choices?: { delta?: { content?: string } }[] };
      const piece = rec.choices?.[0]?.delta?.content;
      if (piece) {
        fullText += piece;
        res.write(`data: ${JSON.stringify({ d: piece })}\n\n`);
      }
    }
  }

  return fullText;
}

export const chatRouter = Router();

chatRouter.post("/stream", optionalAuth, async (req: AuthedRequest, res: Response) => {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return res.status(503).json({
      error: "OPENAI_NOT_CONFIGURED",
      message: "ตั้งค่า OPENAI_API_KEY ในเซิร์ฟเวอร์",
    });
  }

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
  }

  const userId = req.user?.sub;
  const lastUser = [...parsed.data.messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return res.status(400).json({ error: "MISSING_USER_MESSAGE" });
  }

  let activeSessionId: number | null = parsed.data.sessionId ?? null;

  if (parsed.data.sessionId != null && !userId) {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "ต้องเข้าสู่ระบบเพื่อใช้ประวัติแชท" });
  }

  let systemPrompt: string;
  try {
    const ctx = await loadTravelKnowledgeContext();
    const alreadyRecommended = placeNamesAlreadyRecommended(
      parsed.data.messages,
      ctx.places.map((place) => place.name)
    );
    const menuMatches = restaurantsForMenuQuery(lastUser.content, ctx.places);
    systemPrompt = buildSystemPrompt(ctx, alreadyRecommended, menuMatches);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "KNOWLEDGE_LOAD_FAILED" });
  }

  const userMessages = parsed.data.messages;
  const model = process.env.OPENAI_MODEL?.trim() || OPENAI_MODEL_DEFAULT;

  let aiResponse: globalThis.Response;
  try {
    aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        stream: true,
        temperature: 0.45,
        max_tokens: 8192,
        messages: [{ role: "system" as const, content: systemPrompt }, ...userMessages],
      }),
    });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: "AI_UPSTREAM_UNREACHABLE" });
  }

  if (!aiResponse.ok) {
    const t = await aiResponse.text();
    console.error("OpenAI error:", aiResponse.status, t);
    return res.status(502).json({ error: "AI_UPSTREAM_ERROR", status: aiResponse.status });
  }

  if (!aiResponse.body) {
    return res.status(502).json({ error: "AI_EMPTY_BODY" });
  }

  if (userId) {
    try {
      activeSessionId = await resolveSessionForChat(userId, activeSessionId, lastUser.content);
      await insertChatMessage(activeSessionId, "user", lastUser.content);
    } catch (e) {
      if (e instanceof Error && e.message === "SESSION_NOT_FOUND") {
        return res.status(404).json({ error: "SESSION_NOT_FOUND" });
      }
      throw e;
    }
  }

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const onClose = () => {
    try {
      aiResponse.body?.cancel();
    } catch {
      /* ignore */
    }
  };
  req.on("close", onClose);

  try {
    if (userId && activeSessionId != null) {
      res.write(`data: ${JSON.stringify({ meta: { sessionId: activeSessionId } })}\n\n`);
    }

    const assistantText = await pipeOpenAiStreamToClient(aiResponse.body, res);

    if (userId && activeSessionId != null && assistantText.trim()) {
      await insertChatMessage(activeSessionId, "assistant", assistantText);
      await touchSession(activeSessionId);
    }

    if (userId && activeSessionId != null) {
      res.write(`data: ${JSON.stringify({ meta: { sessionId: activeSessionId } })}\n\n`);
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (e) {
    console.error("stream error", e);
    try {
      res.write(`data: ${JSON.stringify({ error: "STREAM_ERROR" })}\n\n`);
      res.write(`data: [DONE]\n\n`);
    } catch {
      /* ignore */
    }
    res.end();
  } finally {
    req.off("close", onClose);
  }
});
