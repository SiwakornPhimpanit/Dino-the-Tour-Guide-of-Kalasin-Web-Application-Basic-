import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { placesApi } from "../api/places";
import { PlaceCard } from "../components/PlaceCard";
import { HERO_BANNER_HEIGHT, HERO_BANNER_IMAGE, HERO_BANNER_WIDTH } from "../lib/media";
import type { PlaceListItem } from "../types";

export function TravelGuidePage() {
  const [places, setPlaces] = useState<PlaceListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await placesApi.list();
        if (alive) setPlaces(data.slice(0, 6));
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="homePage">
      <section className="heroBanner" aria-label="เที่ยวกาฬสินธุ์">
        <img
          className="heroBannerImg"
          src={HERO_BANNER_IMAGE}
          width={HERO_BANNER_WIDTH}
          height={HERO_BANNER_HEIGHT}
          decoding="async"
          alt="เที่ยวกาฬสินธุ์ — ดินแดนแห่งวัฒนธรรม อารยธรรม และธรรมชาติ พระธาตุยาคู บึงบัว และไดโนเสาร์"
        />
      </section>

      <section className="section">
        <div className="sectionHead">
          <h2 className="sectionTitle">แนะนำสถานที่</h2>
          <Link className="sectionMore" to="/places">
            ดูทั้งหมด
          </Link>
        </div>
        {error ? <div className="muted">{error}</div> : null}
        {!places ? <div className="muted">กำลังโหลด...</div> : null}
        {places && places.length === 0 ? <div className="muted">ยังไม่มีข้อมูลสถานที่</div> : null}
        {places && places.length > 0 ? (
          <div className="placeGrid">
            {places.map((p) => (
              <PlaceCard key={p.id} place={p} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
