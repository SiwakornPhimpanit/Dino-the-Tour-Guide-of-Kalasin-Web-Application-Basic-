import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearUserAuth, getStoredAuth, isAdminSession } from "../lib/auth";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminArea = location.pathname.startsWith("/admin");
  const auth = getStoredAuth();

  function navLinkClass(path: string) {
    const active = location.pathname === path;
    return `navLink${active ? " navLinkActive" : ""}`;
  }

  function logout() {
    clearUserAuth();
    navigate("/", { replace: true });
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
        {!isAdminArea ? (
          <Link className={navLinkClass("/assistant")} to="/assistant">
            ผู้ช่วย AI
          </Link>
        ) : null}
        <Link className={navLinkClass("/contact")} to="/contact">
          ติดต่อ
        </Link>
        {auth && !isAdminArea ? (
          <span className="navbarUser muted">
            {auth.user.displayName ?? auth.user.email}
          </span>
        ) : null}
        {auth ? (
          <button type="button" className="navLink navLinkButton" onClick={logout}>
            ออกจากระบบ
          </button>
        ) : (
          <>
            <Link className={navLinkClass("/login")} to="/login">
              เข้าสู่ระบบ
            </Link>
            <Link className={navLinkClass("/register")} to="/register">
              สมัครสมาชิก
            </Link>
          </>
        )}
        {isAdminSession() ? (
          <Link className="navbarAdmin" to="/admin">
            แอดมิน
          </Link>
        ) : (
          <Link className="navbarAdmin" to="/admin/login">
            แอดมิน
          </Link>
        )}
      </nav>
    </header>
  );
}
