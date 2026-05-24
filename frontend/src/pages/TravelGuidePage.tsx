import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { placesApi } from "../api/places";
import { PlaceCard } from "../components/PlaceCard";
import { HERO_COLLAGE } from "../lib/media";
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
      <section className="heroBanner heroBannerCollage" aria-label="เที่ยวกาฬสินธุ์">
        <div className="heroBannerGrid" role="group" aria-label="ภาพไดโนเสาร์และพิพิธภัณฑ์กาฬสินธุ์">
          {HERO_COLLAGE.map((tile, index) => (
            <img
              key={tile.src}
              className="heroBannerTile"
              src={tile.src}
              alt={tile.alt}
              decoding={index === 0 ? "async" : "async"}
              fetchPriority={index === 0 ? "high" : "low"}
              style={tile.position ? { objectPosition: tile.position } : undefined}
            />
          ))}
        </div>
        <div className="heroBannerCaption">
          <p className="heroBannerTag">Dino ไกด์พาเที่ยวเมืองกาฬสินธุ์</p>
          <h1 className="heroBannerTitle">เที่ยวกาฬสินธุ์ วัด วัฒนธรรม และไดโนเสาร์</h1>
          <p className="heroBannerSub">
            พระธาตุยาคู พิพิธภัณฑ์สิรินธร และสถานที่ท่องเที่ยว — ให้ Dino Bot ช่วยวางแผนเที่ยว
          </p>
        </div>
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
