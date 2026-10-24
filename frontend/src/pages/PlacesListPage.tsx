import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { categoriesApi } from "../api/categories";
import { placesApi } from "../api/places";
import { CategorySidebar } from "../components/CategorySidebar";
import { PlaceCard } from "../components/PlaceCard";
import type { Category, PlaceListItem } from "../types";

const KALASIN_DISTRICTS = [
  "เมืองกาฬสินธุ์",
  "กมลาไสย",
  "กุฉินารายณ์",
  "ฆ้องชัย",
  "คำม่วง",
  "ดอนจาน",
  "ท่าคันโท",
  "นาคู",
  "นามน",
  "หนองกุงศรี",
  "ห้วยผึ้ง",
  "ห้วยเม็ก",
  "เขาวง",
  "ยางตลาด",
  "ร่องคำ",
  "สามชัย",
  "สมเด็จ",
  "สหัสขันธ์",
];

export function PlacesListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryIdFromUrl = searchParams.get("category_id");
  const districtFromUrl = searchParams.get("district") ?? "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<PlaceListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(() => (searchParams.get("search") ?? "").trim());
  const [district, setDistrict] = useState(() => districtFromUrl);

  const selectedId = categoryIdFromUrl;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await categoriesApi.list();
        if (alive) setCategories(data);
      } catch {
        if (alive) setCategories([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 280);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setDistrict(districtFromUrl);
  }, [districtFromUrl]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await placesApi.list(selectedId, debouncedSearch || null, district || null);
        if (alive) setItems(data);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      }
    })();
    return () => {
      alive = false;
    };
  }, [selectedId, debouncedSearch, district]);

  function updateQuery(next: { categoryId?: string | null; search?: string; district?: string }) {
    const params = new URLSearchParams();
    const cat = next.categoryId ?? selectedId ?? null;
    if (cat) params.set("category_id", cat);
    const q = (next.search ?? debouncedSearch ?? "").trim();
    if (q) params.set("search", q);
    const d = (next.district ?? district ?? "").trim();
    if (d) params.set("district", d);
    setSearchParams(params);
  }

  function onSelectCategory(id: string | null) {
    updateQuery({ categoryId: id });
  }

  return (
    <div className="listLayout">
      <CategorySidebar categories={categories} selectedId={selectedId} onSelect={onSelectCategory} />
      <section className="listMain panel">
        <div className="panelHeader listPanelHeader">
          <div>
            <div className="panelTitle">รายการสถานที่</div>
            <div className="muted panelSubtitle">
              {items ? `${items.length} รายการ` : "กำลังโหลด..."}
            </div>
          </div>
          <label className="field listPanelSearch">
            <span>อำเภอ</span>
            <select
              value={district}
              onChange={(e) => {
                const v = e.target.value;
                setDistrict(v);
                updateQuery({ district: v });
              }}
              aria-label="เลือกอำเภอ"
            >
              <option value="">ทั้งหมด</option>
              {KALASIN_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="field listPanelSearch">
            <span>ค้นหาสถานที่</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ชื่อสถานที่ หรือเมนู เช่น ลาบ"
              autoComplete="off"
              aria-label="ค้นหาสถานที่"
            />
          </label>
        </div>
        <div className="panelBody">
          {error ? <div className="muted">{error}</div> : null}
          {!items ? <div className="muted">กำลังโหลด...</div> : null}
          {items && items.length === 0 ? (
            <div className="muted">
              {debouncedSearch ? "ไม่พบข้อมูลที่ตรงกับคำค้น" : "ไม่พบข้อมูลในหมวดนี้"}
            </div>
          ) : null}
          {items && items.length > 0 ? (
            <div className="placeGrid">
              {items.map((p) => (
                <PlaceCard key={p.id} place={p} />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
