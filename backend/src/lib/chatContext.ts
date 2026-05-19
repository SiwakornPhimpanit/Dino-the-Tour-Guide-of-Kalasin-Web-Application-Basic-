import { pool } from "../db/pool.js";

export type PlaceContextRow = {
  id: number;
  name: string;
  description: string | null;
  categoryName: string | null;
  district: string | null;
  address: string | null;
  openingHours: string | null;
  bestVisitTime: string | null;
  ticketPrice: string | null;
  activities: string | null;
  suitableFor: string | null;
  highlights: string | null;
  faq: string | null;
  isMustVisit: boolean;
  isRecommendedFirstTrip: boolean;
  estimatedVisitHours: string | null;
  googleMapsUrl: string | null;
  facebookUrl: string | null;
  lineUrl: string | null;
};

export type ItineraryContextRow = {
  id: number;
  title: string;
  durationDays: number;
  durationNights: number;
  audience: string | null;
  budgetLevel: string | null;
  summary: string | null;
  stops: { stopName: string; timeSlot: string | null; note: string | null }[];
};

export type TravelKnowledgeContext = {
  places: PlaceContextRow[];
  itineraries: ItineraryContextRow[];
  localFoods: { name: string; description: string | null; whereToEat: string | null; priceRange: string | null }[];
  souvenirs: { name: string; description: string | null; typicalPrice: string | null; tips: string | null }[];
  stayZones: { zoneName: string; summary: string | null; pros: string | null; cons: string | null; suitableFor: string | null }[];
  travelGuides: { topic: string; title: string; content: string }[];
  provinceInfo: {
    summary: string | null;
    isFamilyFriendly: boolean;
    familyFriendlyNote: string | null;
    firstTimeTips: string | null;
    bestSeason: string | null;
  } | null;
};

function truncateText(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function compactPlace(p: PlaceContextRow) {
  const out: Record<string, unknown> = {
    id: p.id,
    name: p.name,
    category: p.categoryName ?? "",
    description: truncateText(p.description ?? "", 380),
  };
  if (p.district) out.district = p.district;
  if (p.address) out.address = p.address;
  if (p.openingHours) out.openingHours = p.openingHours;
  if (p.bestVisitTime) out.bestVisitTime = p.bestVisitTime;
  if (p.ticketPrice) out.ticketPrice = p.ticketPrice;
  if (p.activities) out.activities = truncateText(p.activities, 200);
  if (p.suitableFor) out.suitableFor = p.suitableFor;
  if (p.highlights) out.highlights = truncateText(p.highlights, 160);
  if (p.faq) out.faq = truncateText(p.faq, 200);
  if (p.isMustVisit) out.isMustVisit = true;
  if (p.isRecommendedFirstTrip) out.isRecommendedFirstTrip = true;
  if (p.estimatedVisitHours) out.estimatedVisitHours = p.estimatedVisitHours;
  if (p.googleMapsUrl) out.googleMapsUrl = p.googleMapsUrl;
  if (p.facebookUrl) out.facebookUrl = p.facebookUrl;
  if (p.lineUrl) out.lineUrl = p.lineUrl;
  return out;
}

export function buildSystemPrompt(ctx: TravelKnowledgeContext): string {
  const places = ctx.places.map(compactPlace);
  const itineraries = ctx.itineraries.map((it) => ({
    title: it.title,
    days: it.durationDays,
    nights: it.durationNights,
    audience: it.audience ?? "",
    budgetLevel: it.budgetLevel ?? "",
    summary: it.summary ?? "",
    stops: it.stops,
  }));

  return [
    "คุณคือผู้ช่วยแนะนำการท่องเที่ยวจังหวัดกาฬสินธุ์ (Dinobot ไกด์พาเที่ยวเมืองกาฬสินธุ์)",
    "กฎสำคัญ:",
    "- ตอบเป็นภาษาไทยเท่านั้น น้ำเสียงสุภาพ อ่านง่าย",
    "- ใช้เฉพาะข้อมูลจาก JSON ด้านล่าง (places, itineraries, localFoods, souvenirs, stayZones, travelGuides, provinceInfo) ห้ามสร้างชื่อสถานที่ ราคา หรือลิงก์ที่ไม่มีในข้อมูล",
    "- คำถามเรื่องแผนเที่ยว 1 วัน / 2 วัน 1 คืน / มาครั้งแรก → ใช้ itineraries และ places ที่เกี่ยวข้อง",
    "- คำถามอาหารพื้นเมือง → localFoods | ของฝาก/ผ้าไหม → souvenirs | พักโซนไหน → stayZones",
    "- คำถามเดินทางจากกรุงเทพ / งบประมาณ → travelGuides",
    "- คำถามครอบครัว/เด็ก → provinceInfo และ suitableFor ของ places",
    "- เมื่อแนะนำสถานที่จาก places ให้ใช้รูปแบบ:",
    "  - ชื่อสถานที่",
    "  หมวด: (category)",
    "  รายละเอียด: (สรุปจาก description/highlights 1–2 ประโยค)",
    "  (ถ้ามี) เวลาเปิด: openingHours | ช่วงที่เหมาะ: bestVisitTime | ค่าเข้า: ticketPrice | กิจกรรม: activities | เหมาะกับ: suitableFor",
    "  แผนที่: URL (เมื่อมี googleMapsUrl — คัดลอกตรงๆ)",
    "  Facebook: URL (เมื่อมี facebookUrl)",
    "  LINE: URL (เมื่อมี lineUrl)",
    "  ข้ามบรรทัดที่ไม่มีข้อมูล",
    "- ห้ามใช้ Markdown ลิงก์ [ข้อความ](url)",
    "- ถ้าไม่มีข้อมูลตอบคำถาม ให้ตอบว่า \"ขออภัย ยังไม่มีข้อมูลในระบบ\" ตรงๆ",
    "- ไม่ต้องคัดลอกคำถามผู้ใช้",
    "",
    `places = ${JSON.stringify(places)}`,
    `itineraries = ${JSON.stringify(itineraries)}`,
    `localFoods = ${JSON.stringify(ctx.localFoods)}`,
    `souvenirs = ${JSON.stringify(ctx.souvenirs)}`,
    `stayZones = ${JSON.stringify(ctx.stayZones)}`,
    `travelGuides = ${JSON.stringify(ctx.travelGuides)}`,
    `provinceInfo = ${JSON.stringify(ctx.provinceInfo)}`,
  ].join("\n");
}

export async function loadTravelKnowledgeContext(): Promise<TravelKnowledgeContext> {
  const [placesRes, itinRes, foodsRes, souvenirsRes, zonesRes, guidesRes, provinceRes] =
    await Promise.all([
      pool.query<PlaceContextRow>(
        `select
           tp.id,
           tp.name,
           tp.description,
           c.name as "categoryName",
           tp.district,
           tp.address,
           tp.opening_hours as "openingHours",
           tp.best_visit_time as "bestVisitTime",
           tp.ticket_price as "ticketPrice",
           tp.activities,
           tp.suitable_for as "suitableFor",
           tp.highlights,
           tp.faq,
           coalesce(tp.is_must_visit, false) as "isMustVisit",
           coalesce(tp.is_recommended_first_trip, false) as "isRecommendedFirstTrip",
           tp.estimated_visit_hours::text as "estimatedVisitHours",
           tp.google_maps_url as "googleMapsUrl",
           tp.facebook_url as "facebookUrl",
           tp.line_url as "lineUrl"
         from tourist_places tp
         left join categories c on c.id = tp.category_id
         where tp.is_active = true
         order by tp.is_recommended_first_trip desc, tp.is_must_visit desc, tp.name asc
         limit 80`
      ),
      pool.query<{
        id: number;
        title: string;
        durationDays: number;
        durationNights: number;
        audience: string | null;
        budgetLevel: string | null;
        summary: string | null;
        stopName: string;
        timeSlot: string | null;
        note: string | null;
        stopOrder: number;
      }>(
        `select
           i.id,
           i.title,
           i.duration_days as "durationDays",
           i.duration_nights as "durationNights",
           i.audience,
           i.budget_level as "budgetLevel",
           i.summary,
           s.stop_name as "stopName",
           s.time_slot as "timeSlot",
           s.note,
           s.stop_order as "stopOrder"
         from itineraries i
         left join itinerary_stops s on s.itinerary_id = i.id
         where i.is_active = true
         order by i.sort_order asc, s.stop_order asc`
      ),
      pool.query(
        `select name, description, where_to_eat as "whereToEat", price_range as "priceRange"
         from local_foods where is_active = true order by sort_order asc`
      ),
      pool.query(
        `select name, description, typical_price as "typicalPrice", tips
         from souvenirs where is_active = true order by sort_order asc`
      ),
      pool.query(
        `select zone_name as "zoneName", summary, pros, cons, suitable_for as "suitableFor"
         from stay_zones where is_active = true order by sort_order asc`
      ),
      pool.query(
        `select topic, title, content from travel_guides where is_active = true order by sort_order asc`
      ),
      pool.query<{
        summary: string | null;
        isFamilyFriendly: boolean;
        familyFriendlyNote: string | null;
        firstTimeTips: string | null;
        bestSeason: string | null;
      }>(
        `select summary, is_family_friendly as "isFamilyFriendly",
                family_friendly_note as "familyFriendlyNote",
                first_time_tips as "firstTimeTips",
                best_season as "bestSeason"
         from province_info where id = 1`
      ),
    ]);

  const itinMap = new Map<number, ItineraryContextRow>();
  for (const row of itinRes.rows) {
    let it = itinMap.get(row.id);
    if (!it) {
      it = {
        id: row.id,
        title: row.title,
        durationDays: row.durationDays,
        durationNights: row.durationNights,
        audience: row.audience,
        budgetLevel: row.budgetLevel,
        summary: row.summary,
        stops: [],
      };
      itinMap.set(row.id, it);
    }
    if (row.stopName) {
      it.stops.push({
        stopName: row.stopName,
        timeSlot: row.timeSlot,
        note: row.note,
      });
    }
  }

  return {
    places: placesRes.rows,
    itineraries: Array.from(itinMap.values()),
    localFoods: foodsRes.rows,
    souvenirs: souvenirsRes.rows,
    stayZones: zonesRes.rows,
    travelGuides: guidesRes.rows,
    provinceInfo: provinceRes.rows[0] ?? null,
  };
}
