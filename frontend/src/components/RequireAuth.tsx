import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { isLoggedIn } from "../lib/auth";

export function RequireAuth({ children }: { children: ReactNode }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
