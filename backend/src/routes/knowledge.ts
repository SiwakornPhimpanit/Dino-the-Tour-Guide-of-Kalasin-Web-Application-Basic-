import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAdmin } from "../middleware/auth.js";
import {
  localFoodCreateSchema,
  localFoodUpdateSchema,
  provinceInfoUpdateSchema,
  stayZoneCreateSchema,
  stayZoneUpdateSchema,
  travelGuideCreateSchema,
  travelGuideUpdateSchema,
} from "../validation/knowledge.js";

export const knowledgeRouter = Router();

knowledgeRouter.use(requireAdmin);

function isPgUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "23505"
  );
}

function parseId(raw: string): number | null {
  const id = Number.parseInt(raw, 10);
  return Number.isFinite(id) ? id : null;
}

// --- local_foods ---

knowledgeRouter.get("/local-foods", async (_req, res, next) => {
  try {
    const result = await pool.query(
      `select id, name, description,
              where_to_eat as "whereToEat",
              price_range as "priceRange",
              sort_order as "sortOrder",
              is_active as "isActive"
         from local_foods
        order by sort_order asc, id asc`
    );
    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

knowledgeRouter.post("/local-foods", async (req, res, next) => {
  try {
    const p = localFoodCreateSchema.parse(req.body);
    const result = await pool.query(
      `insert into local_foods (name, description, where_to_eat, price_range, sort_order, is_active)
       values ($1, $2, $3, $4, $5, $6)
       returning id, name, description,
                 where_to_eat as "whereToEat",
                 price_range as "priceRange",
                 sort_order as "sortOrder",
                 is_active as "isActive"`,
      [p.name.trim(), p.description, p.whereToEat, p.priceRange, p.sortOrder, p.isActive]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

knowledgeRouter.put("/local-foods/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: "INVALID_ID" });
    const p = localFoodUpdateSchema.parse(req.body);
    const result = await pool.query(
      `update local_foods
          set name = $1, description = $2, where_to_eat = $3, price_range = $4,
              sort_order = $5, is_active = $6
        where id = $7
        returning id, name, description,
                  where_to_eat as "whereToEat",
                  price_range as "priceRange",
                  sort_order as "sortOrder",
                  is_active as "isActive"`,
      [p.name.trim(), p.description, p.whereToEat, p.priceRange, p.sortOrder, p.isActive, id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "NOT_FOUND" });
    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

knowledgeRouter.delete("/local-foods/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: "INVALID_ID" });
    const result = await pool.query(`delete from local_foods where id = $1 returning id`, [id]);
    if (!result.rows[0]) return res.status(404).json({ error: "NOT_FOUND" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// --- stay_zones ---

knowledgeRouter.get("/stay-zones", async (_req, res, next) => {
  try {
    const result = await pool.query(
      `select id, zone_name as "zoneName", summary, pros, cons,
              suitable_for as "suitableFor",
              sort_order as "sortOrder",
              is_active as "isActive"
         from stay_zones
        order by sort_order asc, id asc`
    );
    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

knowledgeRouter.post("/stay-zones", async (req, res, next) => {
  try {
    const p = stayZoneCreateSchema.parse(req.body);
    const result = await pool.query(
      `insert into stay_zones (zone_name, summary, pros, cons, suitable_for, sort_order, is_active)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning id, zone_name as "zoneName", summary, pros, cons,
                 suitable_for as "suitableFor",
                 sort_order as "sortOrder",
                 is_active as "isActive"`,
      [p.zoneName.trim(), p.summary, p.pros, p.cons, p.suitableFor, p.sortOrder, p.isActive]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

knowledgeRouter.put("/stay-zones/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: "INVALID_ID" });
    const p = stayZoneUpdateSchema.parse(req.body);
    const result = await pool.query(
      `update stay_zones
          set zone_name = $1, summary = $2, pros = $3, cons = $4,
              suitable_for = $5, sort_order = $6, is_active = $7
        where id = $8
        returning id, zone_name as "zoneName", summary, pros, cons,
                  suitable_for as "suitableFor",
                  sort_order as "sortOrder",
                  is_active as "isActive"`,
      [p.zoneName.trim(), p.summary, p.pros, p.cons, p.suitableFor, p.sortOrder, p.isActive, id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "NOT_FOUND" });
    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

knowledgeRouter.delete("/stay-zones/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: "INVALID_ID" });
    const result = await pool.query(`delete from stay_zones where id = $1 returning id`, [id]);
    if (!result.rows[0]) return res.status(404).json({ error: "NOT_FOUND" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// --- travel_guides ---

knowledgeRouter.get("/travel-guides", async (_req, res, next) => {
  try {
    const result = await pool.query(
      `select id, topic, title, content,
              sort_order as "sortOrder",
              is_active as "isActive"
         from travel_guides
        order by sort_order asc, id asc`
    );
    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

knowledgeRouter.post("/travel-guides", async (req, res, next) => {
  try {
    const p = travelGuideCreateSchema.parse(req.body);
    const result = await pool.query(
      `insert into travel_guides (topic, title, content, sort_order, is_active)
       values ($1, $2, $3, $4, $5)
       returning id, topic, title, content,
                 sort_order as "sortOrder",
                 is_active as "isActive"`,
      [p.topic.trim(), p.title.trim(), p.content.trim(), p.sortOrder, p.isActive]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    if (isPgUniqueViolation(err)) return res.status(409).json({ error: "DUPLICATE_TOPIC" });
    next(err);
  }
});

knowledgeRouter.put("/travel-guides/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: "INVALID_ID" });
    const p = travelGuideUpdateSchema.parse(req.body);
    const result = await pool.query(
      `update travel_guides
          set topic = $1, title = $2, content = $3, sort_order = $4, is_active = $5
        where id = $6
        returning id, topic, title, content,
                  sort_order as "sortOrder",
                  is_active as "isActive"`,
      [p.topic.trim(), p.title.trim(), p.content.trim(), p.sortOrder, p.isActive, id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "NOT_FOUND" });
    res.json({ data: result.rows[0] });
  } catch (err) {
    if (isPgUniqueViolation(err)) return res.status(409).json({ error: "DUPLICATE_TOPIC" });
    next(err);
  }
});

knowledgeRouter.delete("/travel-guides/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: "INVALID_ID" });
    const result = await pool.query(`delete from travel_guides where id = $1 returning id`, [id]);
    if (!result.rows[0]) return res.status(404).json({ error: "NOT_FOUND" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// --- province_info (single row) ---

knowledgeRouter.get("/province-info", async (_req, res, next) => {
  try {
    const result = await pool.query(
      `select id, summary,
              is_family_friendly as "isFamilyFriendly",
              family_friendly_note as "familyFriendlyNote",
              first_time_tips as "firstTimeTips",
              best_season as "bestSeason",
              updated_at as "updatedAt"
         from province_info
        where id = 1`
    );
    if (!result.rows[0]) return res.status(404).json({ error: "NOT_FOUND" });
    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

knowledgeRouter.put("/province-info", async (req, res, next) => {
  try {
    const p = provinceInfoUpdateSchema.parse(req.body);
    const result = await pool.query(
      `insert into province_info (
         id, summary, is_family_friendly, family_friendly_note, first_time_tips, best_season, updated_at
       ) values (1, $1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       on conflict (id) do update set
         summary = excluded.summary,
         is_family_friendly = excluded.is_family_friendly,
         family_friendly_note = excluded.family_friendly_note,
         first_time_tips = excluded.first_time_tips,
         best_season = excluded.best_season,
         updated_at = CURRENT_TIMESTAMP
       returning id, summary,
                 is_family_friendly as "isFamilyFriendly",
                 family_friendly_note as "familyFriendlyNote",
                 first_time_tips as "firstTimeTips",
                 best_season as "bestSeason",
                 updated_at as "updatedAt"`,
      [p.summary, p.isFamilyFriendly, p.familyFriendlyNote, p.firstTimeTips, p.bestSeason]
    );
    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});
