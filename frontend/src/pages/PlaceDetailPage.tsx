import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GoogleMapsIcon } from "../components/GoogleMapsIcon";
import { placesApi } from "../api/places";
import type { PlaceDetail } from "../types";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80";

type FactItem = {
  key: string;
  icon: string;
  label: string;
  value: string;
};

function buildFacts(place: PlaceDetail): FactItem[] {
  const items: FactItem[] = [];
  if (place.district) items.push({ key: "district", icon: "📍", label: "อำเภอ", value: place.district });
  if (place.address) items.push({ key: "address", icon: "🏠", label: "ที่อยู่", value: place.address });
  if (place.openingHours)
    items.push({ key: "hours", icon: "🕐", label: "เวลาเปิด", value: place.openingHours });
  if (place.bestVisitTime)
    items.push({ key: "best", icon: "☀️", label: "ช่วงเวลาที่เหมาะ", value: place.bestVisitTime });
  if (place.ticketPrice)
    items.push({ key: "ticket", icon: "🎫", label: "ค่าเข้าชม", value: place.ticketPrice });
  if (place.estimatedVisitHours != null)
    items.push({
      key: "duration",
      icon: "⏱️",
      label: "เวลาเที่ยวโดยประมาณ",
      value: `${place.estimatedVisitHours} ชั่วโมง`,
    });
  if (place.activities)
    items.push({ key: "activities", icon: "🎯", label: "กิจกรรม", value: place.activities });
  if (place.suitableFor)
    items.push({ key: "suitable", icon: "👥", label: "เหมาะกับ", value: place.suitableFor });
  return items;
}

export function PlaceDetailPage() {
  const { id } = useParams();
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      try {
        const data = await placesApi.get(id);
        if (alive) {
          setPlace(data);
          const cover = data.images.find((i) => i.isCover)?.url;
          const first = cover ?? data.images[0]?.url ?? FALLBACK_IMG;
          setActiveImage(first);
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const thumbs = useMemo(
    () => (place?.images?.length ? place.images.map((i) => i.url) : [FALLBACK_IMG]),
    [place]
  );

  const facts = place ? buildFacts(place) : [];

  return (
    <article className="detailPage">
      <div className="detailTopBar">
        <Link to="/places" className="detailBackLink">
          ← กลับไปรายการสถานที่
        </Link>
        {place ? (
          <div className="detailTopActions">
            {place.googleMapsUrl ? (
              <a
                className="button buttonPrimary detailMapsBtn"
                href={place.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GoogleMapsIcon />
                <span>Google Maps</span>
              </a>
            ) : null}
          </div>
        ) : null}
      </div>

      {error ? <div className="authError detailError">{error}</div> : null}
      {!place && !error ? <div className="detailLoading muted">กำลังโหลด...</div> : null}

      {place ? (
        <>
          <div className="detailGalleryBlock">
            <div className="detailHero">
              <img
                className="detailHeroImg"
                src={activeImage ?? FALLBACK_IMG}
                alt={place.name}
              />
            </div>
            {thumbs.length > 1 ? (
              <div className="detailThumbs" role="list" aria-label="เลือกรูปภาพ">
                {thumbs.map((url, idx) => (
                  <button
                    key={`${idx}-${url}`}
                    type="button"
                    className={`detailThumbBtn${activeImage === url ? " isActive" : ""}`}
                    onClick={() => setActiveImage(url)}
                    aria-label={`รูปที่ ${idx + 1}`}
                  >
                    <img src={url} alt="" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="detailLayout">
            <div className="detailMain">
              <header className="detailIntro">
                <div className="detailBadges">
                  {place.categoryName ? (
                    <span className="detailBadge detailBadgeCategory">{place.categoryName}</span>
                  ) : null}
                  {place.isMustVisit ? (
                    <span className="detailBadge detailBadgeHighlight">✨ สถานที่ไฮไลต์</span>
                  ) : null}
                  {place.isRecommendedFirstTrip ? (
                    <span className="detailBadge detailBadgeTrip">🧳 เหมาะมือใหม่</span>
                  ) : null}
                </div>
                <h1 className="detailTitle">{place.name}</h1>
              </header>

              <section className="detailSection">
                <h2 className="detailSectionTitle">รายละเอียด</h2>
                <p className="detailText">{place.description}</p>
              </section>

              {place.highlights ? (
                <section className="detailHighlightBox">
                  <h2 className="detailSectionTitle">ไฮไลต์</h2>
                  <p className="detailHighlightText">{place.highlights}</p>
                </section>
              ) : null}

              {place.faq ? (
                <section className="detailSection detailFaqSection">
                  <h2 className="detailSectionTitle">คำถามที่พบบ่อย</h2>
                  <p className="detailText detailFaqText">{place.faq}</p>
                </section>
              ) : null}
            </div>

            <aside className="detailAside">
              {facts.length > 0 ? (
                <div className="detailAsideCard">
                  <h2 className="detailAsideTitle">ข้อมูลสำคัญ</h2>
                  <ul className="detailFactsGrid">
                    {facts.map((f) => (
                      <li key={f.key} className="detailFactItem">
                        <span className="detailFactIcon" aria-hidden>
                          {f.icon}
                        </span>
                        <div>
                          <div className="detailFactLabel">{f.label}</div>
                          <div className="detailFactValue">{f.value}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {place.googleMapsUrl || place.facebookUrl || place.lineUrl ? (
                <div className="detailAsideCard detailAsideCardActions">
                  <h2 className="detailAsideTitle">ติดต่อ & นำทาง</h2>
                  <div className="detailAsideActions">
                    {place.googleMapsUrl ? (
                      <a
                        className="button buttonPrimary detailMapsBtn detailAsideBtn"
                        href={place.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <GoogleMapsIcon />
                        <span>เปิดแผนที่</span>
                      </a>
                    ) : null}
                    {place.facebookUrl ? (
                      <a
                        className="button contactSocialLink contactSocialLinkFb detailAsideBtn"
                        href={place.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Facebook
                      </a>
                    ) : null}
                    {place.lineUrl ? (
                      <a
                        className="button contactSocialLink contactSocialLinkLine detailAsideBtn"
                        href={place.lineUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        LINE
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        </>
      ) : null}
    </article>
  );
}
