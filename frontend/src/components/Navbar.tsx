import { Link, useLocation } from "react-router-dom";
import { getStoredAuth, isAdminSession, isLoggedIn } from "../lib/auth";
import { UserMenu } from "./UserMenu";

export function Navbar() {
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith("/admin");
  const auth = getStoredAuth();

  function navLinkClass(path: string) {
    const active = location.pathname === path;
    return `navLink${active ? " navLinkActive" : ""}`;
  }

  function adminNavLinkClass() {
    const active = location.pathname.startsWith("/admin");
    return `navLink${active ? " navLinkActive" : ""}`;
  }

  return (
    <header className="navbar">
      <Link to="/" className="navbarBrand">
        Dino ไกด์พาเที่ยวเมืองกาฬสินธุ์
      </Link>
      <nav className="navbarNav" aria-label="หลัก">
        <Link className={navLinkClass("/")} to="/">
          หน้าแรก
        </Link>
        <Link className={navLinkClass("/map")} to="/map">
          แผนที่
        </Link>
        {isLoggedIn() && auth?.user.role === "member" && !isAdminArea ? (
          <Link className={navLinkClass("/assistant")} to="/assistant">
            Dino bot
          </Link>
        ) : null}
        <Link className={navLinkClass("/contact")} to="/contact">
          ติดต่อ
        </Link>
        {isAdminSession() ? (
          <Link className={adminNavLinkClass()} to="/admin">
            ปรับปรุงเว็บไซต์
          </Link>
        ) : null}
        {!isLoggedIn() ? (
          <>
            <Link className={navLinkClass("/login")} to="/login">
              เข้าสู่ระบบ
            </Link>
            <Link className={navLinkClass("/register")} to="/register">
              สมัครสมาชิก
            </Link>
            <Link
              className={navLinkClass("/admin/login" )} to="/admin/login"
            >
              สำหรับผู้ดูแลระบบ
            </Link>
          </>
        ) : isLoggedIn() ? (
          <UserMenu />
        ) : null}
      </nav>
    </header>
  );
}
