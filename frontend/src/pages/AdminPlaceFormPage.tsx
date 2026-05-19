import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { categoriesApi } from "../api/categories";
import { placesApi } from "../api/places";
import { FormField } from "../components/FormField";
import { uploadPlaceImage } from "../storage/uploadImage";
import type { Category } from "../types";

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

  const coverLabels = useMemo(() => {
    const labels: string[] = [];
    existingUrls.forEach((_, i) => labels.push(`รูปเดิม ${i + 1}`));
    newFiles.forEach((f, i) => labels.push(`ไฟล์ใหม่ ${i + 1}: ${f.name}`));
    return labels;
  }, [existingUrls.length, newFiles]);

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

  const title = isEdit ? "แก้ไขสถานที่" : "เพิ่มสถานที่ใหม่";

  if (isEdit && loadError) {
    return (
      <section className="panel">
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
      <section className="panel">
        <div className="panelHeader adminHeader">
          <div className="panelTitle">{title}</div>
        </div>
        <div className="panelBody muted">กำลังโหลดข้อมูลสถานที่...</div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panelHeader adminHeader">
        <div>
          <div className="panelTitle">{title}</div>
          <div className="muted panelSubtitle">
            {isEdit ? "แก้ไขข้อมูลและรูปภาพ จากนั้นบันทึกการเปลี่ยนแปลง" : "กรอกข้อมูลแล้วอัปโหลดรูปไป Cloudinary"}
          </div>
        </div>
      </div>
      <div className="panelBody">
  <form className="placeForm" onSubmit={onSubmit}>
    {error ? <div className="authError">{error}</div> : null}

    {/* ================= BASIC ================= */}
    <div className="formSection">
      <div className="sectionTitle">ข้อมูลหลัก</div>

      <div className="grid2">
        <FormField label="ชื่อสถานที่">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </FormField>

        <FormField label="หมวดหมู่">
          <select
            value={categoryId === "" ? "" : String(categoryId)}
            onChange={(e) =>
              setCategoryId(
                e.target.value ? Number(e.target.value) : ""
              )
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

      <FormField label="รายละเอียด">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          required
        />
      </FormField>
    </div>

    {/* ================= EXTRA ================= */}
    <div className="formSection">
      <div className="sectionTitle">
        ข้อมูลเพิ่มเติม
      </div>

      <div className="grid2">
        <FormField label="อำเภอ">
          <input
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="เช่น เมืองกาฬสินธุ์"
          />
        </FormField>

        <FormField label="ชั่วโมงเที่ยว">
          <input
            type="number"
            min={0}
            max={24}
            step={0.5}
            value={estimatedVisitHours}
            onChange={(e) =>
              setEstimatedVisitHours(e.target.value)
            }
            placeholder="เช่น 2.5"
          />
        </FormField>
      </div>

      <FormField label="ที่อยู่">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </FormField>

      <div className="grid2">
        <FormField label="เวลาเปิด">
          <input
            value={openingHours}
            onChange={(e) =>
              setOpeningHours(e.target.value)
            }
          />
        </FormField>

        <FormField label="ช่วงเวลาที่เหมาะ">
          <input
            value={bestVisitTime}
            onChange={(e) =>
              setBestVisitTime(e.target.value)
            }
          />
        </FormField>
      </div>

      <div className="grid2">
        <FormField label="ค่าเข้าชม">
          <input
            value={ticketPrice}
            onChange={(e) =>
              setTicketPrice(e.target.value)
            }
            placeholder="ฟรี / 80 บาท"
          />
        </FormField>

        <FormField label="เหมาะกับ">
          <input
            value={suitableFor}
            onChange={(e) =>
              setSuitableFor(e.target.value)
            }
            placeholder="ครอบครัว, เด็ก"
          />
        </FormField>
      </div>

      <FormField label="กิจกรรม">
        <textarea
          value={activities}
          onChange={(e) =>
            setActivities(e.target.value)
          }
          rows={2}
        />
      </FormField>

      <FormField label="ไฮไลต์">
        <textarea
          value={highlights}
          onChange={(e) =>
            setHighlights(e.target.value)
          }
          rows={2}
        />
      </FormField>

      <FormField label="FAQ">
        <textarea
          value={faq}
          onChange={(e) => setFaq(e.target.value)}
          rows={2}
        />
      </FormField>
    </div>

    {/* ================= OPTIONS ================= */}
    <div className="formSection">
      <div className="sectionTitle">
        ตัวเลือกพิเศษ
      </div>

      <div className="trip-options">
        <label
          className={`trip-card ${
            isMustVisit ? "active" : ""
          }`}
        >
          <input
            type="checkbox"
            checked={isMustVisit}
            onChange={(e) =>
              setIsMustVisit(e.target.checked)
            }
          />

          <div className="left">
            <div className="icon">✨</div>

            <div>
              <div className="title">
                สถานที่ไฮไลต์
              </div>

              <div className="desc">
                สถานที่ยอดนิยม / มีชื่อเสียง
              </div>
            </div>
          </div>

          <div className="circle">
            {isMustVisit && "✓"}
          </div>
        </label>

        <label
          className={`trip-card ${
            isRecommendedFirstTrip
              ? "active"
              : ""
          }`}
        >
          <input
            type="checkbox"
            checked={isRecommendedFirstTrip}
            onChange={(e) =>
              setIsRecommendedFirstTrip(
                e.target.checked
              )
            }
          />

          <div className="left">
            <div className="icon">🧳</div>

            <div>
              <div className="title">
                เหมาะสำหรับมือใหม่
              </div>

              <div className="desc">
                แนะนำสำหรับมาครั้งแรก
              </div>
            </div>
          </div>

          <div className="circle">
            {isRecommendedFirstTrip && "✓"}
          </div>
        </label>
      </div>
    </div>

    {/* ================= LINKS ================= */}
    <div className="formSection">
      <div className="sectionTitle">
        ลิงก์ & ช่องทางติดต่อ
      </div>

      <FormField label="Google Maps">
        <input
          type="url"
          value={googleMapsUrl}
          onChange={(e) =>
            setGoogleMapsUrl(e.target.value)
          }
          placeholder="https://maps.app.goo.gl/..."
        />
      </FormField>

      <div className="grid2">
        <FormField label="Facebook">
          <input
            type="url"
            value={facebookUrl}
            onChange={(e) =>
              setFacebookUrl(e.target.value)
            }
            placeholder="https://facebook.com/..."
          />
        </FormField>

        <FormField label="LINE">
          <input
            type="url"
            value={lineUrl}
            onChange={(e) =>
              setLineUrl(e.target.value)
            }
            placeholder="https://line.me/..."
          />
        </FormField>
      </div>
    </div>

    {/* ================= IMAGE ================= */}
    <div className="formSection">
      <div className="sectionTitle">
        รูปภาพ
      </div>

      <FormField
        label={
          isEdit
            ? "เพิ่มรูปใหม่"
            : "อัปโหลดรูป"
        }
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) =>
            setNewFiles(
              Array.from(e.target.files ?? [])
            )
          }
        />
      </FormField>

      {totalImages > 1 ? (
        <FormField label="เลือกรูปปก">
          <select
            value={String(coverIndex)}
            onChange={(e) =>
              setCoverIndex(
                Number(e.target.value)
              )
            }
          >
            {coverLabels.map((label, i) => (
              <option
                key={`${label}-${i}`}
                value={i}
              >
                {label}
              </option>
            ))}
          </select>
        </FormField>
      ) : null}
    </div>

    <div className="submitBar">
      <button
        className="button buttonPrimary saveButton"
        type="submit"
        disabled={busy}
      >
        {busy
          ? "กำลังบันทึก..."
          : "บันทึกข้อมูล"}
      </button>
    </div>
  </form>
</div>
    </section>
  );
}
