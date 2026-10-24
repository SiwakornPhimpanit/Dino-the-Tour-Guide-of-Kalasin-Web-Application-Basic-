import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import * as L from "leaflet";
import { categoriesApi } from "../api/categories";
import { placesApi } from "../api/places";
import type { Category, PlaceListItem } from "../types";

type LatLng = { lat: number; lng: number };

const PLACE_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80";

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

function svgPinDataUrl(color: string): string {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
  <path d="M12.5 41s12-15.2 12-25.1C24.5 7.1 19 0 12.5 0S.5 7.1.5 15.9C.5 25.8 12.5 41 12.5 41z" fill="${color}" stroke="#ffffff" stroke-width="1.2"/>
  <circle cx="12.5" cy="15.5" r="5.2" fill="#ffffff" opacity="0.95"/>
</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const defaultMarkerIcon = L.icon({
  iconUrl: svgPinDataUrl("#2f80ff"),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const selectedMarkerIcon = L.icon({
  iconUrl: svgPinDataUrl("#ff3b3b"),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function isValidLatLng(x: LatLng): boolean {
  return (
    Number.isFinite(x.lat) &&
    Number.isFinite(x.lng) &&
    x.lat >= -90 &&
    x.lat <= 90 &&
    x.lng >= -180 &&
    x.lng <= 180
  );
}

function parseLatLngFromGoogleMapsUrl(url: string): LatLng | null {
  const u = url.trim();
  if (!u) return null;

  // Common patterns:
  // - https://www.google.com/maps/@16.43,103.50,15z
  // - https://www.google.com/maps/search/?api=1&query=16.43,103.50
  // - https://www.google.com/maps?q=16.43,103.50
  const at = u.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (at) {
    const x = { lat: Number(at[1]), lng: Number(at[2]) };
    return isValidLatLng(x) ? x : null;
  }

  const query = u.match(/[?&](?:query|q|ll)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (query) {
    const x = { lat: Number(query[1]), lng: Number(query[2]) };
    return isValidLatLng(x) ? x : null;
  }

  return null;
}

const KALASIN_CENTER: LatLng = { lat: 16.4322, lng: 103.5066 };

function MapFocus({ selected }: { selected: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (!selected) return;
    // Keep current zoom if user already zoomed in/out.
    const z = map.getZoom();
    map.setView([selected.lat, selected.lng], z, { animate: true });
  }, [map, selected]);
  return null;
}

function SelectedPopupController({
  selectedId,
  markerRefs,
}: {
  selectedId: number | null;
  markerRefs: React.MutableRefObject<Map<number, L.Marker>>;
}) {
  const prevSelectedIdRef = useRef<number | null>(null);

  useEffect(() => {
    const prev = prevSelectedIdRef.current;
    if (prev != null && prev !== selectedId) {
      markerRefs.current.get(prev)?.closePopup();
    }
    if (selectedId != null) {
      markerRefs.current.get(selectedId)?.openPopup();
    }
    prevSelectedIdRef.current = selectedId;
  }, [selectedId, markerRefs]);

  return null;
}

export function PlacesMapPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<PlaceListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const markerRefs = useRef<Map<number, L.Marker>>(new Map());
  const sidebarItemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [places, cats] = await Promise.all([placesApi.list(null, null), categoriesApi.list()]);
        if (alive) setItems(places.data);
        if (alive) setCategories(cats);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cat = selectedCategoryId.trim();
    const dist = selectedDistrict.trim();
    return (items ?? []).filter((p) => {
      if (cat) {
        if (String(p.categoryId ?? "") !== cat) return false;
      }
      if (dist) {
        if (!p.district?.trim().startsWith(dist)) return false;
      }
      if (q) {
        const menuText = (p.recommendedMenus ?? []).map((menu) => menu.name).join(" ");
        const hay = `${p.name} ${p.description ?? ""} ${p.categoryName ?? ""} ${p.district ?? ""} ${menuText}`.toLowerCase();
        const dish = q.replace(/^ร้าน\s*/u, "").trim();
        const matched = hay.includes(q) || (dish.length > 0 && dish !== q && hay.includes(dish));
        if (!matched) return false;
      }
      return true;
    });
  }, [items, search, selectedCategoryId, selectedDistrict]);

  const markers = useMemo(() => {
    const list = (filteredItems ?? []).map((p) => ({
      place: p,
      pos: p.googleMapsUrl ? parseLatLngFromGoogleMapsUrl(p.googleMapsUrl) : null,
    }));
    return list.filter((x) => x.pos != null) as { place: PlaceListItem; pos: LatLng }[];
  }, [filteredItems]);

  const selected = useMemo(() => (filteredItems ?? []).find((p) => p.id === selectedId) ?? null, [filteredItems, selectedId]);
  const selectedPos = useMemo(() => {
    if (!selected?.googleMapsUrl) return null;
    return parseLatLngFromGoogleMapsUrl(selected.googleMapsUrl);
  }, [selected]);

  useEffect(() => {
    if (selectedId == null) return;
    const el = sidebarItemRefs.current.get(selectedId);
    el?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [selectedId]);

  return (
    <div className="mapLayout">
      <aside className="mapSidebar panel" aria-label="รายการสถานที่">
        <div className="panelHeader mapSidebarHeader">
          <div>
            <div className="panelTitle">แผนที่สถานที่ท่องเที่ยว</div>
            <div className="muted panelSubtitle">
              {items ? `${filteredItems.length}/${items.length} รายการ • มีพิกัด ${markers.length} รายการ` : "กำลังโหลด..."}
            </div>
          </div>
        </div>

        <div className="panelBody mapSidebarBody">
          {error ? <div className="muted">{error}</div> : null}
          {!items ? <div className="muted">กำลังโหลด...</div> : null}

          {items ? (
            <div className="mapFilters" role="group" aria-label="ค้นหาและกรอง">
              <label className="field mapFilter">
                <span>ค้นหาสถานที่</span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelectedId(null);
                  }}
                  placeholder="ชื่อสถานที่ หรือเมนูอาหาร"
                  autoComplete="off"
                />
              </label>
              <label className="field mapFilter">
                <span>หมวดหมู่</span>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => {
                    setSelectedCategoryId(e.target.value);
                    setSelectedId(null);
                  }}
                >
                  <option value="">ทั้งหมด</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field mapFilter">
                <span>อำเภอ</span>
                <select
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setSelectedId(null);
                  }}
                >
                  <option value="">ทั้งหมด</option>
                  {KALASIN_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}

          {items ? (
            <div className="mapSidebarList" role="list">
              {filteredItems.map((p) => {
                const hasPos = Boolean(p.googleMapsUrl && parseLatLngFromGoogleMapsUrl(p.googleMapsUrl));
                const isActive = selectedId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`mapSidebarItem${isActive ? " isActive" : ""}`}
                    ref={(el) => {
                      if (!el) sidebarItemRefs.current.delete(p.id);
                      else sidebarItemRefs.current.set(p.id, el);
                    }}
                    onClick={() => {
                      setSelectedId(p.id);
                      if (!hasPos) return;
                      // focus the map by selecting; marker popup handles navigation
                    }}
                    aria-label={`เลือก ${p.name}`}
                  >
                    <div className="mapSidebarItemTitle">
                      {p.name}
                      {!hasPos ? <span className="mapSidebarItemTag">ไม่มีพิกัด</span> : null}
                    </div>
                    <div className="mapSidebarItemMeta muted">
                      {p.categoryName ? p.categoryName : "ไม่ระบุหมวด"}
                      {p.district ? ` • ${p.district}` : null}
                    </div>
                    {p.recommendedMenus?.length ? (
                      <div className="mapSidebarItemMeta muted">
                        เมนูแนะนำ: {p.recommendedMenus.slice(0, 3).map((menu) => menu.name).join(" · ")}
                        {p.recommendedMenus.length > 3 ? " …" : ""}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </aside>

      <section className="mapMain panel" aria-label="แผนที่">
        <div className="panelHeader mapMainHeader">
          <div className="panelTitle">Map</div>
          <div className="muted panelSubtitle">
            ชี้เมาส์ที่หมุดเพื่อดูรายละเอียด คลิกเพื่อเลือกและไปหน้ารายละเอียด
            {selected ? ` • เลือก: ${selected.name}` : null}
          </div>
        </div>

        <div className="panelBody mapMainBody">
          <MapContainer center={[KALASIN_CENTER.lat, KALASIN_CENTER.lng]} zoom={10} scrollWheelZoom className="leafletMap">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapFocus selected={selectedPos} />
            <SelectedPopupController selectedId={selectedId} markerRefs={markerRefs} />

            {markers.map(({ place, pos }) => (
              <Marker
                key={place.id}
                position={[pos.lat, pos.lng]}
                icon={selectedId === place.id ? selectedMarkerIcon : defaultMarkerIcon}
                ref={(m) => {
                  if (!m) {
                    markerRefs.current.delete(place.id);
                    return;
                  }
                  markerRefs.current.set(place.id, m);
                }}
                eventHandlers={{
                  click: () => setSelectedId(place.id),
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -38]}
                  opacity={1}
                  className="mapMarkerTooltip"
                >
                  <div className="mapTooltip">
                    <img
                      className="mapTooltipImg"
                      src={place.coverImageUrl ?? PLACE_FALLBACK_IMG}
                      alt=""
                      loading="lazy"
                    />
                    <div className="mapTooltipTitle" title={place.name}>
                      {place.name}
                    </div>
                  </div>
                </Tooltip>
                <Popup>
                  <div className="mapPopup">
                    <img
                      className="mapPopupImg"
                      src={place.coverImageUrl ?? PLACE_FALLBACK_IMG}
                      alt=""
                      loading="lazy"
                    />
                    <div className="mapPopupTitle" title={place.name}>
                      {place.name}
                    </div>
                    <div className="mapPopupMeta">
                      {place.categoryName ?? "ไม่ระบุหมวด"}
                      {place.district ? ` • ${place.district}` : ""}
                    </div>
                    <button
                      type="button"
                      className="button buttonPrimary mapPopupBtn"
                      onClick={() => navigate(`/places/${place.id}`)}
                    >
                      ดูรายละเอียด
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </section>
    </div>
  );
}

