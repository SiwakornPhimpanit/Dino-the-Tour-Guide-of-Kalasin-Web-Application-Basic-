import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { categoriesApi } from "../api/categories";
import { placesApi } from "../api/places";
import { FormField } from "../components/FormField";
import { uploadPlaceImage } from "../storage/uploadImage";
import type { Category } from "../types";

function FormAccordion({
  title,
  hint,
  defaultOpen = false,
  children,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`placeFormSection placeFormAccordion${open ? " isOpen" : ""}`}>
      <button
        type="button"
        className="placeFormAccordionHead"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <div className="placeFormSectionTitle">{title}</div>
          {hint && !open ? <p className="placeFormSectionHint">{hint}</p> : null}
        </div>
        <span className="placeFormAccordionChevron" aria-hidden>
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open ? <div className="placeFormSectionBody">{children}</div> : null}
    </div>
  );
}

export function AdminPlaceFormPage({ mode }: { mode: "create" | "edit" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === "edit";

  const [categories, setCategories] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(isEdit);

  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [lineUrl, setLineUrl] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [bestVisitTime, setBestVisitTime] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [activities, setActivities] = useState("");
  const [suitableFor, setSuitableFor] = useState("");
  const [highlights, setHighlights] = useState("");
  const [faq, setFaq] = useState("");
  const [isMustVisit, setIsMustVisit] = useState(false);
  const [isRecommendedFirstTrip, setIsRecommendedFirstTrip] = useState(false);
  const [estimatedVisitHours, setEstimatedVisitHours] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await categoriesApi.list();
        if (alive) {
          setCategories(data);
          if (!isEdit && data[0]) setCategoryId(data[0].id);
        }
      } catch {
        if (alive) setCategories([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit || !id) return;
    let alive = true;
    setLoadError(null);
    (async () => {
      try {
        const place = await placesApi.get(id);
        if (!alive) return;
        setName(place.name);
        setDescription(place.description);
        setCategoryId(place.categoryId ?? "");
        setGoogleMapsUrl(place.googleMapsUrl ?? "");
        setFacebookUrl(place.facebookUrl ?? "");
        setLineUrl(place.lineUrl ?? "");
        setDistrict(place.district ?? "");
        setAddress(place.address ?? "");
        setOpeningHours(place.openingHours ?? "");
        setBestVisitTime(place.bestVisitTime ?? "");
        setTicketPrice(place.ticketPrice ?? "");
        setActivities(place.activities ?? "");
        setSuitableFor(place.suitableFor ?? "");
        setHighlights(place.highlights ?? "");
        setFaq(place.faq ?? "");
        setIsMustVisit(place.isMustVisit ?? false);
        setIsRecommendedFirstTrip(place.isRecommendedFirstTrip ?? false);
        setEstimatedVisitHours(
          place.estimatedVisitHours != null ? String(place.estimatedVisitHours) : ""
        );
        const urls = place.images.map((i) => i.url);
        setExistingUrls(urls);
        const cov = place.images.findIndex((i) => i.isCover);
        setCoverIndex(cov >= 0 ? cov : 0);
      } catch (e) {
        if (alive) setLoadError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (alive) setDetailLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, isEdit]);

  const totalImages = existingUrls.length + newFiles.length;

  useEffect(() => {
    setCoverIndex((i) => {
      if (totalImages <= 0) return 0;
      return Math.min(Math.max(i, 0), totalImages - 1);
    });
  }, [totalImages]);

  const newPreviewUrls = useMemo(
    () => newFiles.map((f) => URL.createObjectURL(f)),
    [newFiles]
  );

  useEffect(() => {
    return () => {
      newPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newPreviewUrls]);

  const hasExtraInfo = Boolean(
    district.trim() ||
      address.trim() ||
      openingHours.trim() ||
      bestVisitTime.trim() ||
      ticketPrice.trim() ||
      estimatedVisitHours.trim()
  );

  const hasAiFields = Boolean(
    activities.trim() || suitableFor.trim() || highlights.trim() || faq.trim()
  );

  const hasLinks = Boolean(googleMapsUrl.trim() || facebookUrl.trim() || lineUrl.trim());

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (categoryId === "") {
        setError("กรุณาเลือกหมวดหมู่");
        return;
      }

      const uploads = await Promise.all(
        newFiles.map((file, i) => uploadPlaceImage(file, `${name}-new-${i}`))
      );
      const allUrls = [...existingUrls, ...uploads];

      if (allUrls.length === 0) {
        setError("ต้องมีอย่างน้อย 1 รูปภาพ");
        return;
      }

      const images = allUrls.map((url, i) => ({
        url,
        isCover: i === coverIndex,
      }));

      const trimOrNull = (s: string) => {
        const t = s.trim();
        return t === "" ? null : t;
      };
      const hoursRaw = estimatedVisitHours.trim();
      const hoursNum = hoursRaw === "" ? null : Number(hoursRaw);
      if (hoursRaw !== "" && !Number.isFinite(hoursNum)) {
        setError("ชั่วโมงเที่ยวโดยประมาณต้องเป็นตัวเลข");
        return;
      }

      const payload = {
        name,
        description,
        categoryId,
        googleMapsUrl: trimOrNull(googleMapsUrl),
        facebookUrl: trimOrNull(facebookUrl),
        lineUrl: trimOrNull(lineUrl),
        district: trimOrNull(district),
        address: trimOrNull(address),
        openingHours: trimOrNull(openingHours),
        bestVisitTime: trimOrNull(bestVisitTime),
        ticketPrice: trimOrNull(ticketPrice),
        activities: trimOrNull(activities),
        suitableFor: trimOrNull(suitableFor),
        highlights: trimOrNull(highlights),
        faq: trimOrNull(faq),
        isMustVisit,
        isRecommendedFirstTrip,
        estimatedVisitHours: hoursNum,
        images,
      };

      if (isEdit) {
        if (!id) throw new Error("ไม่พบรหัสสถานที่");
        await placesApi.update(id, payload);
      } else {
        await placesApi.create(payload);
      }
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  function removeExistingImage(index: number) {
    setExistingUrls((prev) => prev.filter((_, i) => i !== index));
    setCoverIndex((i) => (i > index ? i - 1 : i === index ? 0 : i));
  }

  function removeNewFile(index: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setCoverIndex((i) => {
      const globalIdx = existingUrls.length + index;
      if (i > globalIdx) return i - 1;
      if (i === globalIdx) return 0;
      return i;
    });
  }

  const title = isEdit ? "แก้ไขสถานที่" : "เพิ่มสถานที่ใหม่";

  if (isEdit && loadError) {
    return (
      <section className="panel placeFormPanel">
        <div className="panelHeader adminHeader">
          <div className="panelTitle">{title}</div>
          <Link to="/admin" className="button">
            กลับ
          </Link>
        </div>
        <div className="panelBody">
          <div className="authError">{loadError}</div>
        </div>
      </section>
    );
  }

  if (isEdit && detailLoading) {
    return (
      <section className="panel placeFormPanel">
        <div className="panelHeader adminHeader">
          <div className="panelTitle">{title}</div>
        </div>
        <div className="panelBody muted">กำลังโหลดข้อมูลสถานที่...</div>
      </section>
    );
  }

  return (
    <section className="panel placeFormPanel">
      <div className="panelHeader adminHeader placeFormHeader">
        <div>
          <div className="panelTitle">{title}</div>
          <div className="muted panelSubtitle">
            กรอกเฉพาะข้อมูลหลักก่อน ส่วนอื่นเปิดเพิ่มได้เมื่อต้องการ
          </div>
        </div>
        <Link to="/admin" className="button">
          กลับ
        </Link>
      </div>

      <div className="panelBody placeFormBody">
        <form className="placeForm" onSubmit={onSubmit}>
          {error ? <div className="authError">{error}</div> : null}

          <div className="placeFormLayout">
            <div className="placeFormLayoutMain">
              <div className="placeFormSection placeFormSectionPrimary">
                <div className="placeFormSectionTitle">ข้อมูลหลัก</div>
                <div className="placeFormSectionBody">
                  <div className="grid2">
                    <FormField label="ชื่อสถานที่">
                      <input value={name} onChange={(e) => setName(e.target.value)} required />
                    </FormField>
                    <FormField label="หมวดหมู่">
                      <select
                        value={categoryId === "" ? "" : String(categoryId)}
                        onChange={(e) =>
                          setCategoryId(e.target.value ? Number(e.target.value) : "")
                        }
                        required
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>
                  <FormField label="รายละเอียด" hint="อธิบายสั้นๆ ว่าสถานที่นี้มีอะไรน่าสนใจ">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      required
                    />
                  </FormField>
                </div>
              </div>

              <div className="placeFormAccordions">
                <FormAccordion
                  title="ที่ตั้ง & เวลาเที่ยว"
                  hint="อำเภอ ที่อยู่ เวลาเปิด ค่าเข้าชม (ไม่บังคับ)"
                  defaultOpen={hasExtraInfo}
                >
                  <div className="grid2">
                    <FormField label="อำเภอ">
                      <input
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="เช่น เมืองกาฬสินธุ์"
                      />
                    </FormField>
                    <FormField label="ชั่วโมงเที่ยวโดยประมาณ">
                      <input
                        type="number"
                        min={0}
                        max={24}
                        step={0.5}
                        value={estimatedVisitHours}
                        onChange={(e) => setEstimatedVisitHours(e.target.value)}
                        placeholder="เช่น 2.5"
                      />
                    </FormField>
                  </div>
                  <FormField label="ที่อยู่">
                    <input value={address} onChange={(e) => setAddress(e.target.value)} />
                  </FormField>
                  <div className="grid2">
                    <FormField label="เวลาเปิด">
                      <input value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} />
                    </FormField>
                    <FormField label="ช่วงเวลาที่เหมาะ">
                      <input value={bestVisitTime} onChange={(e) => setBestVisitTime(e.target.value)} />
                    </FormField>
                  </div>
                  <div className="grid2">
                    <FormField label="ค่าเข้าชม">
                      <input
                        value={ticketPrice}
                        onChange={(e) => setTicketPrice(e.target.value)}
                        placeholder="ฟรี / 80 บาท"
                      />
                    </FormField>
                    <FormField label="เหมาะกับ">
                      <input
                        value={suitableFor}
                        onChange={(e) => setSuitableFor(e.target.value)}
                        placeholder="ครอบครัว, เด็ก"
                      />
                    </FormField>
                  </div>
                </FormAccordion>

                <FormAccordion
                  title="ข้อมูลสำหรับ AI"
                  hint="กิจกรรม ไฮไลต์ FAQ — ช่วยให้ Dino bot ตอบได้ละเอียดขึ้น"
                  defaultOpen={hasAiFields}
                >
                  <FormField label="กิจกรรม">
                    <textarea value={activities} onChange={(e) => setActivities(e.target.value)} rows={2} />
                  </FormField>
                  <FormField label="ไฮไลต์">
                    <textarea value={highlights} onChange={(e) => setHighlights(e.target.value)} rows={2} />
                  </FormField>
                  <FormField label="FAQ">
                    <textarea
                      value={faq}
                      onChange={(e) => setFaq(e.target.value)}
                      rows={3}
                      placeholder="คำถามที่พบบ่อยและคำตอบ"
                    />
                  </FormField>
                </FormAccordion>

                <FormAccordion
                  title="ลิงก์ & ช่องทางติดต่อ"
                  hint="Google Maps, Facebook, LINE"
                  defaultOpen={hasLinks}
                >
                  <FormField label="Google Maps">
                    <input
                      type="url"
                      value={googleMapsUrl}
                      onChange={(e) => setGoogleMapsUrl(e.target.value)}
                      placeholder="https://maps.app.goo.gl/..."
                    />
                  </FormField>
                  <div className="grid2">
                    <FormField label="Facebook">
                      <input
                        type="url"
                        value={facebookUrl}
                        onChange={(e) => setFacebookUrl(e.target.value)}
                        placeholder="https://facebook.com/..."
                      />
                    </FormField>
                    <FormField label="LINE">
                      <input
                        type="url"
                        value={lineUrl}
                        onChange={(e) => setLineUrl(e.target.value)}
                        placeholder="https://line.me/..."
                      />
                    </FormField>
                  </div>
                </FormAccordion>
              </div>
            </div>

            <aside className="placeFormLayoutSide">
              <div className="placeFormSection">
                <div className="placeFormSectionTitle">รูปภาพ</div>
                <div className="placeFormSectionBody">
                  <label className="placeUploadZone">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={(e) => setNewFiles(Array.from(e.target.files ?? []))}
                    />
                    <span className="placeUploadIcon" aria-hidden>
                      📷
                    </span>
                    <span className="placeUploadText">คลิกเพื่อเลือกรูป หรือลากไฟล์มาวาง</span>
                    <span className="placeUploadHint muted">รองรับหลายรูป · ต้องมีอย่างน้อย 1 รูป</span>
                  </label>

                  {totalImages > 0 ? (
                    <div className="placeImageGrid">
                      {existingUrls.map((url, i) => (
                        <div
                          key={`ex-${url}`}
                          className={`placeImageTile${coverIndex === i ? " isCover" : ""}`}
                        >
                          <img src={url} alt="" />
                          <button
                            type="button"
                            className="placeImageCoverBtn"
                            onClick={() => setCoverIndex(i)}
                          >
                            {coverIndex === i ? "รูปปก" : "ตั้งเป็นปก"}
                          </button>
                          <button
                            type="button"
                            className="placeImageRemoveBtn"
                            aria-label="ลบรูป"
                            onClick={() => removeExistingImage(i)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {newPreviewUrls.map((url, i) => {
                        const globalIdx = existingUrls.length + i;
                        return (
                          <div
                            key={`new-${url}`}
                            className={`placeImageTile${coverIndex === globalIdx ? " isCover" : ""}`}
                          >
                            <img src={url} alt="" />
                            <span className="placeImageNewBadge">ใหม่</span>
                            <button
                              type="button"
                              className="placeImageCoverBtn"
                              onClick={() => setCoverIndex(globalIdx)}
                            >
                              {coverIndex === globalIdx ? "รูปปก" : "ตั้งเป็นปก"}
                            </button>
                            <button
                              type="button"
                              className="placeImageRemoveBtn"
                              aria-label="ลบรูป"
                              onClick={() => removeNewFile(i)}
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="placeFormSection placeFormSectionCompact">
                <div className="placeFormSectionTitle">ป้ายแนะนำ</div>
                <div className="placeFormSectionBody">
                  <div className="trip-options trip-optionsStack">
                    <label className={`trip-card${isMustVisit ? " active" : ""}`}>
                      <input
                        type="checkbox"
                        checked={isMustVisit}
                        onChange={(e) => setIsMustVisit(e.target.checked)}
                      />
                      <div className="trip-cardMain">
                        <span className="trip-cardIcon" aria-hidden>
                          ✨
                        </span>
                        <div>
                          <div className="trip-cardTitle">สถานที่ไฮไลต์</div>
                          <div className="trip-cardDesc">ยอดนิยม / มีชื่อเสียง</div>
                        </div>
                      </div>
                      <span className="trip-cardCheck">{isMustVisit ? "✓" : ""}</span>
                    </label>
                    <label className={`trip-card${isRecommendedFirstTrip ? " active" : ""}`}>
                      <input
                        type="checkbox"
                        checked={isRecommendedFirstTrip}
                        onChange={(e) => setIsRecommendedFirstTrip(e.target.checked)}
                      />
                      <div className="trip-cardMain">
                        <span className="trip-cardIcon" aria-hidden>
                          🧳
                        </span>
                        <div>
                          <div className="trip-cardTitle">เหมาะมือใหม่</div>
                          <div className="trip-cardDesc">แนะนำสำหรับมาครั้งแรก</div>
                        </div>
                      </div>
                      <span className="trip-cardCheck">{isRecommendedFirstTrip ? "✓" : ""}</span>
                    </label>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <div className="placeFormActions">
            <Link to="/admin" className="button">
              ยกเลิก
            </Link>
            <button className="button buttonPrimary" type="submit" disabled={busy}>
              {busy ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
