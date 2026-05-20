import { env } from "../lib/env";
import { http } from "../lib/http";
import type { AuthUser, StoredAuth } from "../lib/auth";

const base = env.apiBaseUrl.replace(/\/$/, "");

type AuthResponse = { data: StoredAuth };

export type UpdateProfileInput = {
  email?: string;
  displayName?: string;
  currentPassword?: string;
  newPassword?: string;
};

export const authApi = {
  register(body: { email: string; password: string; displayName?: string }) {
    return http<AuthResponse>(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  },

  login(body: { email: string; password: string }) {
    return http<AuthResponse>(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  },

  me() {
    return http<{ data: AuthUser }>(`${base}/api/auth/me`);
  },

  updateProfile(body: UpdateProfileInput) {
    return http<AuthResponse>(`${base}/api/auth/me`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  },
};
