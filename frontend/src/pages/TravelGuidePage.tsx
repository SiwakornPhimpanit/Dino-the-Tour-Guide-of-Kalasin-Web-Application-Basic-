import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { placesApi } from "../api/places";
import { PlaceCard } from "../components/PlaceCard";
import { HERO_KALASIN_CULTURE_IMAGE, HERO_KALASIN_DINO_SCENE_IMAGE } from "../lib/media";
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
      <section className="heroCollage" aria-label="แนะนำจังหวัดกาฬสินธุ์">
        <div
          className="heroCollageSide heroCollageSideLeft"
          style={{ ["--hero-side-img" as string]: `url("${HERO_KALASIN_CULTURE_IMAGE}")` }}
          role="img"
          aria-label="วัฒนธรรมผ้าไหมแพรวา จังหวัดกาฬสินธุ์"
        />
        <div className="heroCollageCenter">
          <p className="heroCollageKicker">แหล่งท่องเที่ยว</p>
          <h1 className="heroCollageTitle">กาฬสินธุ์</h1>
          <p className="heroCollageTagline">พาไปรู้จักสถานที่สวยงามทั่วจังหวัด</p>
          <Link className="heroCollagePill buttonPrimary" to="/places">
            <span className="heroCollagePillIcon" aria-hidden>
              📍
            </span>
            <span>ดูสถานที่ท่องเที่ยวทั้งหมด</span>
          </Link>
        </div>
        <div
          className="heroCollageSide heroCollageSideRight"
          style={{ ["--hero-side-img" as string]: `url("${HERO_KALASIN_DINO_SCENE_IMAGE}")` }}
          role="img"
          aria-label="พิพิธภัณฑ์ไดโนเสาร์ภาคอีสาน"
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
