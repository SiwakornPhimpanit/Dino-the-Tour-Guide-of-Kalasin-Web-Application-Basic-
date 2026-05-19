import { env } from "../lib/env";
import { http } from "../lib/http";

const base = env.apiBaseUrl.replace(/\/$/, "");

export type ChatSessionSummary = {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessageRecord = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export const chatApi = {
  listSessions() {
    return http<{ data: ChatSessionSummary[] }>(`${base}/api/chat/sessions`);
  },

  createSession(title?: string) {
    return http<{ data: ChatSessionSummary }>(`${base}/api/chat/sessions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(title ? { title } : {}),
    });
  },

  getSessionMessages(sessionId: number) {
    return http<{
      data: {
        session: ChatSessionSummary;
        messages: ChatMessageRecord[];
      };
    }>(`${base}/api/chat/sessions/${sessionId}/messages`);
  },

  deleteSession(sessionId: number) {
    return http<void>(`${base}/api/chat/sessions/${sessionId}`, { method: "DELETE" });
  },
};
