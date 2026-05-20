import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AUTH_CHANGED_EVENT,
  clearUserAuth,
  getStoredAuth,
  userDisplayLabel,
  type AuthUser,
} from "../lib/auth";
import { UserAvatar } from "./UserAvatar";

export function UserMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(() => getStoredAuth()?.user ?? null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function sync() {
      setUser(getStoredAuth()?.user ?? null);
    }
    sync();
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  function logout() {
    clearUserAuth();
    setOpen(false);
    navigate("/", { replace: true });
  }

  const label = userDisplayLabel(user);

  return (
    <div className="userMenu" ref={rootRef}>
      <button
        type="button"
        className="userMenuTrigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <UserAvatar size="sm" />
        <span className="userMenuName">{label}</span>
        <span className="userMenuChevron" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div className="userMenuDropdown" role="menu">
          <div className="userMenuDropdownHead">
            <UserAvatar size="md" />
            <div>
              <div className="userMenuDropdownName">{label}</div>
              <div className="userMenuDropdownEmail muted">{user.email}</div>
            </div>
          </div>
          {user.role !== "admin" ? (
          <Link
            className="userMenuItem"
            role="menuitem"
            to="/profile"
            onClick={() => setOpen(false)}
          >
            แก้ไขข้อมูลผู้ใช้
          </Link>
          ) : null}
          <button type="button" className="userMenuItem userMenuItemDanger" role="menuitem" onClick={logout}>
            ออกจากระบบ
          </button>
        </div>
      ) : null}
    </div>
  );
}
