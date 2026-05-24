import { Link, Outlet, useLocation } from "react-router-dom";
export function AdminLayout() {
  const location = useLocation();

  const placesListActive =
    location.pathname === "/admin" || location.pathname.startsWith("/admin/edit/");
  const createActive = location.pathname === "/admin/new";
  const categoriesActive = location.pathname.startsWith("/admin/categories");
  const knowledgeActive = location.pathname.startsWith("/admin/knowledge");

  return (
    <div className="adminLayout">
      <div className="adminToolbar panel">
        <div className="adminToolbarInner">
          <nav className="adminSubNav" aria-label="เมนูผู้ดูแล">
            <Link className={`adminSubLink${placesListActive ? " isActive" : ""}`} to="/admin">
              รายการสถานที่ทั้งหมด
            </Link>
            <Link className={`adminSubLink${createActive ? " isActive" : ""}`} to="/admin/new">
              เพิ่มสถานที่
            </Link>
            <Link className={`adminSubLink${categoriesActive ? " isActive" : ""}`} to="/admin/categories">
              เพิ่มหมวดหมู่
            </Link>
            <Link className={`adminSubLink${knowledgeActive ? " isActive" : ""}`} to="/admin/knowledge">
              ข้อมูล AI
            </Link>
          </nav>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
