export const USER_AUTH_KEY = "karasin_user_auth";

/** @deprecated ใช้ JWT แทน — ลบออกจาก sessionStorage อัตโนมัติ */
export const ADMIN_AUTH_KEY = "karasin_admin_auth";

export type AuthUser = {
  id: number;
  email: string;
  displayName: string | null;
  role: "member" | "admin";
};

export type StoredAuth = {
  token: string;
  user: AuthUser;
};

function readStored(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(USER_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuth;
    if (!parsed?.token || !parsed?.user?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** ล้าง session แอดมินแบบเก่า (ก่อนมี JWT) */
export function migrateLegacyAdminSession(): void {
  if (sessionStorage.getItem(ADMIN_AUTH_KEY) === "1") {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
  }
}

export function getStoredAuth(): StoredAuth | null {
  migrateLegacyAdminSession();
  return readStored();
}

export function setStoredAuth(auth: StoredAuth): void {
  localStorage.setItem(USER_AUTH_KEY, JSON.stringify(auth));
  sessionStorage.removeItem(ADMIN_AUTH_KEY);
}

export function clearUserAuth(): void {
  localStorage.removeItem(USER_AUTH_KEY);
  sessionStorage.removeItem(ADMIN_AUTH_KEY);
}

export function getAuthToken(): string | null {
  return getStoredAuth()?.token ?? null;
}

export function isLoggedIn(): boolean {
  return Boolean(getAuthToken());
}

export function isAdminSession(): boolean {
  const auth = getStoredAuth();
  return auth?.user.role === "admin";
}

export function clearAdminSession(): void {
  clearUserAuth();
}
