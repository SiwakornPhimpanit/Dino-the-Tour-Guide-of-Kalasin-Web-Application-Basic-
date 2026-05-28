import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { placesApi } from "../api/places";
import { ConfirmDialog } from "../components/ConfirmDialog";
import type { PlaceListItem, PlacesListMeta } from "../types";

const PAGE_SIZE = 10;

export function AdminPlacesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<PlaceListItem[] | null>(null);
  const [meta, setMeta] = useState<PlacesListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PlaceListItem | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 280);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    let alive = true;
    setError(null);
    setLoading(true);
    (async () => {
      try {
        const { data, meta: listMeta } = await placesApi.list(null, debouncedSearch || null, null, {
          page,
          limit: PAGE_SIZE,
        });
        if (!alive) return;
        setItems(data);
        setMeta(listMeta ?? null);
        if (listMeta && listMeta.totalPages > 0 && page > listMeta.totalPages) {
          setPage(listMeta.totalPages);
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [debouncedSearch, page]);

  async function confirmDelete() {
    const place = pendingDelete;
    if (!place) return;
    setBusyId(place.id);
    setError(null);
    try {
      await placesApi.remove(String(place.id));
      const remaining = (items ?? []).filter((p) => p.id !== place.id);
      const newTotal = Math.max(0, (meta?.total ?? remaining.length) - 1);
      const newTotalPages = newTotal === 0 ? 0 : Math.ceil(newTotal / PAGE_SIZE);
      setItems(remaining);
      setMeta((m) =>
        m
          ? { ...m, total: newTotal, totalPages: newTotalPages }
          : { page, limit: PAGE_SIZE, total: newTotal, totalPages: newTotalPages }
      );
      if (newTotalPages > 0 && page > newTotalPages) {
        setPage(newTotalPages);
      } else if (remaining.length === 0 && page > 1) {
        setPage((p) => p - 1);
      }
      setPendingDelete(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  }

  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total);
  const pageNumbers = totalPages > 0 ? Array.from({ length: totalPages }, (_, i) => i + 1) : [];

  return (
    <>
      <ConfirmDialog
        open={pendingDelete !== null}
        title="ลบสถานที่นี้หรือไม่?"
        tone="danger"
        confirmLabel="ลบเลย"
        cancelLabel="ยกเลิก"
        confirmBusy={busyId !== null && pendingDelete?.id === busyId}
        onCancel={() => {
          if (busyId !== null) return;
          setPendingDelete(null);
        }}
        onConfirm={confirmDelete}
      >
        <p className="dialogLead">
          คุณกำลังจะลบ <strong>{pendingDelete?.name}</strong>
        </p>
        <p className="dialogMuted">การลบจะถาวร และไม่สามารถกู้คืนได้</p>
      </ConfirmDialog>

      <section className="panel adminPlacesPanel">
        <div className="panelHeader adminHeader">
          <div>
            <div className="panelTitle">จัดการสถานที่ท่องเที่ยว</div>
            <div className="muted panelSubtitle">
              ค้นหาได้จากชื่อ รายละเอียด หรือชื่อหมวดหมู่ · {PAGE_SIZE} รายการต่อหน้า
            </div>
          </div>
        </div>
        <div className="panelBody stack">
          <label className="field adminSearchField">
            <span>ค้นหา</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="พิมพ์คำค้นแล้วรอผลไม่เกินประมาณ 0.3 วินาที..."
              autoComplete="off"
            />
          </label>

          {error ? <div className="authError">{error}</div> : null}

          {loading ? <div className="muted">กำลังโหลด...</div> : null}

          {!loading && items && items.length === 0 ? (
            <div className="muted">ไม่พบข้อมูลที่ตรงกับคำค้น</div>
          ) : null}

          {!loading && items && items.length > 0 ? (
            <>
              <div className="adminListSummary muted">
                แสดง {rangeStart}–{rangeEnd} จาก {total} รายการ
              </div>
              <div className="adminTableWrap">
                <table className="adminTable">
                  <thead>
                    <tr>
                      <th scope="col" style={{ textAlign: "center" }}>
                        รูป
                      </th>
                      <th scope="col" style={{ textAlign: "center" }}>
                        ชื่อสถานที่
                      </th>
                      <th scope="col" style={{ textAlign: "center" }}>
                        หมวด
                      </th>
                      <th scope="col" className="adminTableActions" style={{ textAlign: "center" }}>
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((p) => (
                      <tr key={p.id}>
                        <td style={{ textAlign: "center" }}>
                          <div className="adminThumbCell">
                            {p.coverImageUrl ? (
                              <img src={p.coverImageUrl} alt="" className="adminThumb" />
                            ) : (
                              <div className="adminThumbPlaceholder muted">ไม่มีรูป</div>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <div className="adminPlaceName">{p.name}</div>
                          <div className="muted adminPlaceShort">{p.description}</div>
                        </td>
                        <td style={{ textAlign: "center" }}>{p.categoryName ?? "—"}</td>
                        <td style={{ textAlign: "center" }}>
                          <div
                            className="adminRowActions"
                            style={{
                              display: "flex",
                              gap: "8px",
                              justifyContent: "center",
                            }}
                          >
                            <Link
                              to={`/admin/edit/${p.id}`}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "6px",
                                background: "#3b82f6",
                                color: "white",
                                textDecoration: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              title="แก้ไข"
                            >
                              ✏️
                            </Link>
                            <button
                              type="button"
                              disabled={busyId === p.id}
                              onClick={() => setPendingDelete(p)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "6px",
                                background: "#ef4444",
                                color: "white",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              title="ลบ"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 ? (
                <nav className="adminPagination" aria-label="เปลี่ยนหน้ารายการสถานที่">
                  <div className="adminPaginationPages">
                    {pageNumbers.map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`adminPaginationPage${n === page ? " isActive" : ""}`}
                        aria-current={n === page ? "page" : undefined}
                        disabled={loading || n === page}
                        onClick={() => setPage(n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </nav>
              ) : null}
            </>
          ) : null}
        </div>
      </section>
    </>
  );
}
