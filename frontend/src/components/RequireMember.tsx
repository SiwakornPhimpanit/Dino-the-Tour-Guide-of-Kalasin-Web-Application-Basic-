import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getStoredAuth } from "../lib/auth";

export function RequireMember({ children }: { children: ReactNode }) {
  const auth = getStoredAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (auth.user.role === "admin") return <Navigate to="/admin" replace />;
  return <>{children}</>;
}
