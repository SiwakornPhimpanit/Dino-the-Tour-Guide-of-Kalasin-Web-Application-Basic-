import { useCallback, useEffect, useState, type FormEvent } from "react";
import { knowledgeApi } from "../api/knowledge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { FormField } from "../components/FormField";
import { HttpError } from "../lib/http";
import type { LocalFood, ProvinceInfo, StayZone, TravelGuide } from "../types";

type TabId = "foods" | "zones" | "guides" | "province";

const TABS: { id: TabId; label: string }[] = [
  { id: "foods", label: "อาหารท้องถิ่น" },
  { id: "zones", label: "โซนที่พัก" },
  { id: "guides", label: "คู่มือเที่ยว" },
  { id: "province", label: "ข้อมูลจังหวัด" },
];

function apiErrorCode(err: unknown): string | undefined {
  if (!(err instanceof HttpError)) return undefined;
  const b = err.body;
  if (b && typeof b === "object" && "error" in b) return String((b as { error: string }).error);
  return undefined;
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`adminKnowledgeBadge${active ? " isActive" : ""}`}>
      {active ? "เปิดใช้" : "ปิด"}
    </span>
  );
}

function SortOrderField({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <FormField label="ลำดับแสดง">
      <input
        type="number"
        min={0}
        max={9999}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </FormField>
  );
}

function ActiveCheckbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="adminKnowledgeActiveCheck">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>เปิดใช้งาน (AI อ่านได้)</span>
    </label>
  );
}

export function AdminKnowledgePage() {
  const [tab, setTab] = useState<TabId>("foods");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [foods, setFoods] = useState<LocalFood[] | null>(null);
  const [zones, setZones] = useState<StayZone[] | null>(null);
  const [guides, setGuides] = useState<TravelGuide[] | null>(null);
  const [province, setProvince] = useState<ProvinceInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ type: TabId; id: number; name: string } | null>(
    null
  );

  const loadFoods = useCallback(async () => setFoods(await knowledgeApi.localFoods.list()), []);
  const loadZones = useCallback(async () => setZones(await knowledgeApi.stayZones.list()), []);
  const loadGuides = useCallback(async () => setGuides(await knowledgeApi.travelGuides.list()), []);
  const loadProvince = useCallback(async () => setProvince(await knowledgeApi.provinceInfo.get()), []);

  useEffect(() => {
    setError(null);
    setInfo(null);
    (async () => {
      try {
        if (tab === "foods") await loadFoods();
        if (tab === "zones") await loadZones();
        if (tab === "guides") await loadGuides();
        if (tab === "province") await loadProvince();
      } catch (e) {
        setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      }
    })();
  }, [tab, loadFoods, loadGuides, loadProvince, loadZones]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    setError(null);
    try {
      if (pendingDelete.type === "foods") {
        await knowledgeApi.localFoods.remove(pendingDelete.id);
        await loadFoods();
      } else if (pendingDelete.type === "zones") {
        await knowledgeApi.stayZones.remove(pendingDelete.id);
        await loadZones();
      } else if (pendingDelete.type === "guides") {
        await knowledgeApi.travelGuides.remove(pendingDelete.id);
        await loadGuides();
      }
      setInfo("ลบข้อมูลแล้ว");
      setPendingDelete(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ConfirmDialog
        open={pendingDelete !== null}
        title="ลบรายการนี้หรือไม่?"
        tone="danger"
        confirmLabel="ลบเลย"
        cancelLabel="ยกเลิก"
        confirmBusy={busy}
        onCancel={() => {
          if (busy) return;
          setPendingDelete(null);
        }}
        onConfirm={confirmDelete}
      >
        <p className="dialogLead">
          คุณกำลังจะลบ <strong>{pendingDelete?.name}</strong>
        </p>
        <p className="dialogMuted">AI จะไม่ใช้ข้อมูลนี้ในการตอบอีกต่อไป</p>
      </ConfirmDialog>

      <section className="panel adminKnowledgePanel">
        <div className="panelHeader adminHeader">
          <div>
            <div className="panelTitle">จัดการข้อมูล AI</div>
            <div className="muted panelSubtitle">
              อาหาร ที่พัก คู่มือ และข้อมูลจังหวัด — ใช้ประกอบการตอบของ Dino
            </div>
          </div>
        </div>

        <div className="panelBody stack">
          <div className="adminKnowledgeTabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`adminKnowledgeTab${tab === t.id ? " isActive" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {error ? <div className="authError">{error}</div> : null}
          {info ? (
            <div className="adminInfoBanner" role="status">
              <span className="adminInfoBannerText">{info}</span>
              <button type="button" className="button buttonSmall" onClick={() => setInfo(null)}>
                ปิด
              </button>
            </div>
          ) : null}

          {tab === "foods" ? (
            <LocalFoodsTab
              items={foods}
              onReload={loadFoods}
              onError={setError}
              onInfo={setInfo}
              onDelete={(item) => setPendingDelete({ type: "foods", id: item.id, name: item.name })}
            />
          ) : null}
          {tab === "zones" ? (
            <StayZonesTab
              items={zones}
              onReload={loadZones}
              onError={setError}
              onInfo={setInfo}
              onDelete={(item) => setPendingDelete({ type: "zones", id: item.id, name: item.zoneName })}
            />
          ) : null}
          {tab === "guides" ? (
            <TravelGuidesTab
              items={guides}
              onReload={loadGuides}
              onError={setError}
              onInfo={setInfo}
              onDelete={(item) => setPendingDelete({ type: "guides", id: item.id, name: item.title })}
            />
          ) : null}
          {tab === "province" ? (
            <ProvinceTab data={province} onSaved={loadProvince} onError={setError} onInfo={setInfo} />
          ) : null}
        </div>
      </section>
    </>
  );
}

function LocalFoodsTab({
  items,
  onReload,
  onError,
  onInfo,
  onDelete,
}: {
  items: LocalFood[] | null;
  onReload: () => Promise<void>;
  onError: (m: string | null) => void;
  onInfo: (m: string | null) => void;
  onDelete: (item: LocalFood) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [whereToEat, setWhereToEat] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<LocalFood | null>(null);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    onError(null);
    try {
      await knowledgeApi.localFoods.create({
        name,
        description: description || null,
        whereToEat: whereToEat || null,
        priceRange: priceRange || null,
        sortOrder,
        isActive,
      });
      setName("");
      setDescription("");
      setWhereToEat("");
      setPriceRange("");
      setSortOrder(0);
      onInfo("เพิ่มอาหารแล้ว");
      await onReload();
    } catch (err) {
      onError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    onError(null);
    try {
      await knowledgeApi.localFoods.update(editing.id, editing);
      setEditing(null);
      onInfo("บันทึกแล้ว");
      await onReload();
    } catch (err) {
      onError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <form className="adminKnowledgeForm panel stack" onSubmit={onCreate}>
        <div className="adminKnowledgeFormTitle">เพิ่มอาหารท้องถิ่น</div>
        <div className="grid2">
          <FormField label="ชื่ออาหาร">
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </FormField>
          <SortOrderField value={sortOrder} onChange={setSortOrder} />
        </div>
        <FormField label="รายละเอียด">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </FormField>
        <div className="grid2">
          <FormField label="แนะนำร้าน/พื้นที่">
            <input value={whereToEat} onChange={(e) => setWhereToEat(e.target.value)} />
          </FormField>
          <FormField label="ช่วงราคา">
            <input value={priceRange} onChange={(e) => setPriceRange(e.target.value)} placeholder="40–80 บาท" />
          </FormField>
        </div>
        <ActiveCheckbox checked={isActive} onChange={setIsActive} />
        <button className="button buttonPrimary" type="submit" disabled={busy}>
          {busy ? "กำลังบันทึก..." : "เพิ่มรายการ"}
        </button>
      </form>

      {editing ? (
        <form className="adminKnowledgeForm panel stack" onSubmit={saveEdit}>
          <div className="adminKnowledgeFormTitle">แก้ไข: {editing.name}</div>
          <div className="grid2">
            <FormField label="ชื่ออาหาร">
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                required
              />
            </FormField>
            <SortOrderField
              value={editing.sortOrder}
              onChange={(n) => setEditing({ ...editing, sortOrder: n })}
            />
          </div>
          <FormField label="รายละเอียด">
            <textarea
              value={editing.description ?? ""}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              rows={2}
            />
          </FormField>
          <div className="grid2">
            <FormField label="แนะนำร้าน/พื้นที่">
              <input
                value={editing.whereToEat ?? ""}
                onChange={(e) => setEditing({ ...editing, whereToEat: e.target.value })}
              />
            </FormField>
            <FormField label="ช่วงราคา">
              <input
                value={editing.priceRange ?? ""}
                onChange={(e) => setEditing({ ...editing, priceRange: e.target.value })}
              />
            </FormField>
          </div>
          <ActiveCheckbox
            checked={editing.isActive}
            onChange={(v) => setEditing({ ...editing, isActive: v })}
          />
          <div className="adminRowActions">
            <button className="button buttonPrimary" type="submit" disabled={busy}>
              บันทึก
            </button>
            <button className="button" type="button" onClick={() => setEditing(null)}>
              ยกเลิก
            </button>
          </div>
        </form>
      ) : null}

      {!items ? <div className="muted">กำลังโหลด...</div> : null}
      {items && items.length === 0 ? <div className="muted">ยังไม่มีข้อมูล</div> : null}
      {items && items.length > 0 ? (
        <div className="adminTableWrap">
          <table className="adminTable adminKnowledgeTable">
            <thead>
              <tr>
                <th>ชื่อ</th>
                <th>ราคา</th>
                <th>ลำดับ</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    {item.description ? <div className="muted adminKnowledgeCellSub">{item.description}</div> : null}
                  </td>
                  <td>{item.priceRange ?? "—"}</td>
                  <td>{item.sortOrder}</td>
                  <td>
                    <ActiveBadge active={item.isActive} />
                  </td>
                  <td>
                    <div className="adminRowActions">
                      <button type="button" className="button buttonSmall buttonPrimary" onClick={() => setEditing(item)}>
                        แก้ไข
                      </button>
                      <button type="button" className="button buttonSmall buttonDanger" onClick={() => onDelete(item)}>
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function StayZonesTab({
  items,
  onReload,
  onError,
  onInfo,
  onDelete,
}: {
  items: StayZone[] | null;
  onReload: () => Promise<void>;
  onError: (m: string | null) => void;
  onInfo: (m: string | null) => void;
  onDelete: (item: StayZone) => void;
}) {
  const empty: Omit<StayZone, "id"> = {
    zoneName: "",
    summary: null,
    pros: null,
    cons: null,
    suitableFor: null,
    sortOrder: 0,
    isActive: true,
  };
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<StayZone | null>(null);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    onError(null);
    try {
      await knowledgeApi.stayZones.create(form);
      setForm(empty);
      onInfo("เพิ่มโซนที่พักแล้ว");
      await onReload();
    } catch (err) {
      onError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    onError(null);
    try {
      await knowledgeApi.stayZones.update(editing.id, editing);
      setEditing(null);
      onInfo("บันทึกแล้ว");
      await onReload();
    } catch (err) {
      onError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  function ZoneForm({
    data,
    onChange,
    onSubmit,
    submitLabel,
    title,
    onCancel,
  }: {
    data: Omit<StayZone, "id">;
    onChange: (d: Omit<StayZone, "id">) => void;
    onSubmit: (e: FormEvent) => void;
    submitLabel: string;
    title: string;
    onCancel?: () => void;
  }) {
    return (
      <form className="adminKnowledgeForm panel stack" onSubmit={onSubmit}>
        <div className="adminKnowledgeFormTitle">{title}</div>
        <div className="grid2">
          <FormField label="ชื่อโซน">
            <input
              value={data.zoneName}
              onChange={(e) => onChange({ ...data, zoneName: e.target.value })}
              required
            />
          </FormField>
          <SortOrderField value={data.sortOrder} onChange={(n) => onChange({ ...data, sortOrder: n })} />
        </div>
        <FormField label="สรุป">
          <textarea value={data.summary ?? ""} onChange={(e) => onChange({ ...data, summary: e.target.value })} rows={2} />
        </FormField>
        <div className="grid2">
          <FormField label="ข้อดี">
            <textarea value={data.pros ?? ""} onChange={(e) => onChange({ ...data, pros: e.target.value })} rows={2} />
          </FormField>
          <FormField label="ข้อเสีย">
            <textarea value={data.cons ?? ""} onChange={(e) => onChange({ ...data, cons: e.target.value })} rows={2} />
          </FormField>
        </div>
        <FormField label="เหมาะกับ">
          <input value={data.suitableFor ?? ""} onChange={(e) => onChange({ ...data, suitableFor: e.target.value })} />
        </FormField>
        <ActiveCheckbox checked={data.isActive} onChange={(v) => onChange({ ...data, isActive: v })} />
        <div className="adminRowActions">
          <button className="button buttonPrimary" type="submit" disabled={busy}>
            {busy ? "กำลังบันทึก..." : submitLabel}
          </button>
          {onCancel ? (
            <button className="button" type="button" onClick={onCancel}>
              ยกเลิก
            </button>
          ) : null}
        </div>
      </form>
    );
  }

  return (
    <div className="stack">
      <ZoneForm data={form} onChange={setForm} onSubmit={onCreate} submitLabel="เพิ่มโซน" title="เพิ่มโซนที่พัก" />
      {editing ? (
        <ZoneForm
          data={editing}
          onChange={(d) => setEditing({ ...editing, ...d })}
          onSubmit={saveEdit}
          submitLabel="บันทึก"
          title={`แก้ไข: ${editing.zoneName}`}
          onCancel={() => setEditing(null)}
        />
      ) : null}
      {!items ? <div className="muted">กำลังโหลด...</div> : null}
      {items && items.length > 0 ? (
        <div className="adminTableWrap">
          <table className="adminTable adminKnowledgeTable">
            <thead>
              <tr>
                <th>โซน</th>
                <th>ลำดับ</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.zoneName}</strong>
                    {item.summary ? <div className="muted adminKnowledgeCellSub">{item.summary}</div> : null}
                  </td>
                  <td>{item.sortOrder}</td>
                  <td>
                    <ActiveBadge active={item.isActive} />
                  </td>
                  <td>
                    <div className="adminRowActions">
                      <button type="button" className="button buttonSmall buttonPrimary" onClick={() => setEditing(item)}>
                        แก้ไข
                      </button>
                      <button type="button" className="button buttonSmall buttonDanger" onClick={() => onDelete(item)}>
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        items && <div className="muted">ยังไม่มีข้อมูล</div>
      )}
    </div>
  );
}

function TravelGuidesTab({
  items,
  onReload,
  onError,
  onInfo,
  onDelete,
}: {
  items: TravelGuide[] | null;
  onReload: () => Promise<void>;
  onError: (m: string | null) => void;
  onInfo: (m: string | null) => void;
  onDelete: (item: TravelGuide) => void;
}) {
  const empty: Omit<TravelGuide, "id"> = {
    topic: "",
    title: "",
    content: "",
    sortOrder: 0,
    isActive: true,
  };
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<TravelGuide | null>(null);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    onError(null);
    try {
      await knowledgeApi.travelGuides.create(form);
      setForm(empty);
      onInfo("เพิ่มคู่มือแล้ว");
      await onReload();
    } catch (err) {
      if (apiErrorCode(err) === "DUPLICATE_TOPIC") onError("มี topic นี้อยู่แล้ว (ต้องไม่ซ้ำ)");
      else onError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    onError(null);
    try {
      await knowledgeApi.travelGuides.update(editing.id, editing);
      setEditing(null);
      onInfo("บันทึกแล้ว");
      await onReload();
    } catch (err) {
      if (apiErrorCode(err) === "DUPLICATE_TOPIC") onError("มี topic นี้อยู่แล้ว (ต้องไม่ซ้ำ)");
      else onError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  function GuideForm({
    data,
    onChange,
    onSubmit,
    submitLabel,
    title,
    onCancel,
  }: {
    data: Omit<TravelGuide, "id">;
    onChange: (d: Omit<TravelGuide, "id">) => void;
    onSubmit: (e: FormEvent) => void;
    submitLabel: string;
    title: string;
    onCancel?: () => void;
  }) {
    return (
      <form className="adminKnowledgeForm panel stack" onSubmit={onSubmit}>
        <div className="adminKnowledgeFormTitle">{title}</div>
        <div className="grid2">
          <FormField label="Topic (รหัส)" hint="ภาษาอังกฤษ ไม่ซ้ำ เช่น transport">
            <input value={data.topic} onChange={(e) => onChange({ ...data, topic: e.target.value })} required />
          </FormField>
          <SortOrderField value={data.sortOrder} onChange={(n) => onChange({ ...data, sortOrder: n })} />
        </div>
        <FormField label="หัวข้อแสดง">
          <input value={data.title} onChange={(e) => onChange({ ...data, title: e.target.value })} required />
        </FormField>
        <FormField label="เนื้อหา">
          <textarea value={data.content} onChange={(e) => onChange({ ...data, content: e.target.value })} rows={5} required />
        </FormField>
        <ActiveCheckbox checked={data.isActive} onChange={(v) => onChange({ ...data, isActive: v })} />
        <div className="adminRowActions">
          <button className="button buttonPrimary" type="submit" disabled={busy}>
            {busy ? "กำลังบันทึก..." : submitLabel}
          </button>
          {onCancel ? (
            <button className="button" type="button" onClick={onCancel}>
              ยกเลิก
            </button>
          ) : null}
        </div>
      </form>
    );
  }

  return (
    <div className="stack">
      <GuideForm data={form} onChange={setForm} onSubmit={onCreate} submitLabel="เพิ่มคู่มือ" title="เพิ่มคู่มือเที่ยว" />
      {editing ? (
        <GuideForm
          data={editing}
          onChange={(d) => setEditing({ ...editing, ...d })}
          onSubmit={saveEdit}
          submitLabel="บันทึก"
          title={`แก้ไข: ${editing.title}`}
          onCancel={() => setEditing(null)}
        />
      ) : null}
      {!items ? <div className="muted">กำลังโหลด...</div> : null}
      {items && items.length > 0 ? (
        <div className="adminTableWrap">
          <table className="adminTable adminKnowledgeTable">
            <thead>
              <tr>
                <th>หัวข้อ</th>
                <th>Topic</th>
                <th>ลำดับ</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                  </td>
                  <td>
                    <code>{item.topic}</code>
                  </td>
                  <td>{item.sortOrder}</td>
                  <td>
                    <ActiveBadge active={item.isActive} />
                  </td>
                  <td>
                    <div className="adminRowActions">
                      <button type="button" className="button buttonSmall buttonPrimary" onClick={() => setEditing(item)}>
                        แก้ไข
                      </button>
                      <button type="button" className="button buttonSmall buttonDanger" onClick={() => onDelete(item)}>
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        items && <div className="muted">ยังไม่มีข้อมูล</div>
      )}
    </div>
  );
}

function ProvinceTab({
  data,
  onSaved,
  onError,
  onInfo,
}: {
  data: ProvinceInfo | null;
  onSaved: () => Promise<void>;
  onError: (m: string | null) => void;
  onInfo: (m: string | null) => void;
}) {
  const [form, setForm] = useState<Omit<ProvinceInfo, "id" | "updatedAt"> | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        summary: data.summary,
        isFamilyFriendly: data.isFamilyFriendly,
        familyFriendlyNote: data.familyFriendlyNote,
        firstTimeTips: data.firstTimeTips,
        bestSeason: data.bestSeason,
      });
    }
  }, [data]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    onError(null);
    try {
      await knowledgeApi.provinceInfo.update(form);
      onInfo("บันทึกข้อมูลจังหวัดแล้ว");
      await onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  if (!data || !form) return <div className="muted">กำลังโหลด...</div>;

  return (
    <form className="adminKnowledgeForm panel stack" onSubmit={onSubmit}>
      <div className="adminKnowledgeFormTitle">ข้อมูลจังหวัดกาฬสินธุ์ (แถวเดียว)</div>
      <p className="muted adminKnowledgeHint">
        ใช้สรุปภาพรวมจังหวัดให้ AI ตอบ — อัปเดตล่าสุด: {new Date(data.updatedAt).toLocaleString("th-TH")}
      </p>
      <FormField label="สรุปจังหวัด">
        <textarea value={form.summary ?? ""} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={4} />
      </FormField>
      <label className="adminKnowledgeActiveCheck">
        <input
          type="checkbox"
          checked={form.isFamilyFriendly}
          onChange={(e) => setForm({ ...form, isFamilyFriendly: e.target.checked })}
        />
        <span>เหมาะกับครอบครัว</span>
      </label>
      <FormField label="หมายเหตุครอบครัว">
        <textarea
          value={form.familyFriendlyNote ?? ""}
          onChange={(e) => setForm({ ...form, familyFriendlyNote: e.target.value })}
          rows={3}
        />
      </FormField>
      <FormField label="คำแนะนำมือใหม่">
        <textarea value={form.firstTimeTips ?? ""} onChange={(e) => setForm({ ...form, firstTimeTips: e.target.value })} rows={3} />
      </FormField>
      <FormField label="ฤดูท่องเที่ยวที่เหมาะ">
        <textarea value={form.bestSeason ?? ""} onChange={(e) => setForm({ ...form, bestSeason: e.target.value })} rows={3} />
      </FormField>
      <button className="button buttonPrimary" type="submit" disabled={busy}>
        {busy ? "กำลังบันทึก..." : "บันทึกข้อมูลจังหวัด"}
      </button>
    </form>
  );
}
