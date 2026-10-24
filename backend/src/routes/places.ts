import { Router } from "express";
import type { PoolClient } from "pg";
import { pool } from "../db/pool.js";
import { placeCreateSchema, placeReplaceSchema, type PlaceCreateBody } from "../validation/place.js";

const RESTAURANT_CATEGORY_NAME = "ร้านอาหาร";
const MIN_RESTAURANT_MENUS = 3;

async function menusForSave(payload: PlaceCreateBody) {
  const category = await pool.query(`select name from categories where id = $1`, [payload.categoryId]);
  if (!category.rows[0]) return { error: "INVALID_CATEGORY_ID" as const };
  const isRestaurant = String(category.rows[0].name).trim() === RESTAURANT_CATEGORY_NAME;
  const menus = isRestaurant ? payload.recommendedMenus : [];
  if (isRestaurant && menus.length < MIN_RESTAURANT_MENUS) {
    return { error: "RESTAURANT_MENUS_REQUIRED" as const };
  }
  return { menus };
}

async function replaceRecommendedMenus(
  client: PoolClient,
  placeId: number,
  menus: PlaceCreateBody["recommendedMenus"]
) {
  await client.query(`delete from place_recommended_menus where place_id = $1`, [placeId]);
  for (let i = 0; i < menus.length; i++) {
    const menu = menus[i];
    await client.query(
      `insert into place_recommended_menus (place_id, name, price, sort_order)
       values ($1, $2, $3, $4)`,
      [placeId, menu.name, menu.price ?? null, i]
    );
  }
}

async function loadRecommendedMenus(placeId: number | string) {
  const result = await pool.query(
    `select name, price
     from place_recommended_menus
     where place_id = $1
     order by sort_order asc, id asc`,
    [placeId]
  );
  return result.rows;
}

export const placesRouter = Router();

const placeRowSelect = `
         tp.id,
         tp.name,
         tp.description,
         tp.google_maps_url as "googleMapsUrl",
         tp.facebook_url as "facebookUrl",
         tp.line_url as "lineUrl",
         tp.category_id as "categoryId",
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
         tp.estimated_visit_hours as "estimatedVisitHours",
         coalesce(tp.display_order, 0) as "displayOrder"`;

function placeInsertParams(payload: PlaceCreateBody) {
  return [
    payload.name,
    payload.description,
    payload.categoryId,
    payload.googleMapsUrl ?? null,
    payload.facebookUrl ?? null,
    payload.lineUrl ?? null,
    payload.district ?? null,
    payload.address ?? null,
    payload.openingHours ?? null,
    payload.bestVisitTime ?? null,
    payload.ticketPrice ?? null,
    payload.activities ?? null,
    payload.suitableFor ?? null,
    payload.highlights ?? null,
    payload.faq ?? null,
    payload.isMustVisit ?? false,
    payload.isRecommendedFirstTrip ?? false,
    payload.estimatedVisitHours ?? null,
    payload.displayOrder ?? 0,
  ];
}

const placeInsertColumns = `
  name, description, category_id, google_maps_url, facebook_url, line_url,
  district, address, opening_hours, best_visit_time, ticket_price,
  activities, suitable_for, highlights, faq,
  is_must_visit, is_recommended_first_trip, estimated_visit_hours, display_order`;

const placesListFromWhere = `
       from tourist_places tp
       left join categories c on c.id = tp.category_id
       where tp.is_active = true
         and ($1::int is null or tp.category_id = $1)
         and ($3::text is null or coalesce(tp.district, '') ilike $3 || '%')
         and (
           $2::text is null
           or tp.name ilike '%' || $2 || '%'
           or tp.description ilike '%' || $2 || '%'
           or coalesce(c.name, '') ilike '%' || $2 || '%'
           or coalesce(tp.district, '') ilike '%' || $2 || '%'
         )`;

const placesListOrderBy = `
       order by tp.display_order asc, tp.id asc`;

function parsePaginationQuery(req: { query: Record<string, unknown> }) {
  const hasPage = req.query.page !== undefined && req.query.page !== "";
  const hasLimit = req.query.limit !== undefined && req.query.limit !== "";
  if (!hasPage && !hasLimit) return null;

  const pageRaw = req.query.page;
  const limitRaw = req.query.limit;
  const page = Number.parseInt(String(pageRaw ?? "1"), 10);
  const limit = Number.parseInt(String(limitRaw ?? "10"), 10);
  if (!Number.isFinite(page) || page < 1) return { error: "INVALID_PAGE" as const };
  if (!Number.isFinite(limit) || limit < 1 || limit > 100) return { error: "INVALID_LIMIT" as const };
  return { page, limit };
}

placesRouter.get("/", async (req, res, next) => {
  try {
    const raw = req.query.category_id;
    const categoryId =
      raw === undefined || raw === "" || raw === "all"
        ? null
        : Number.parseInt(String(raw), 10);
    if (raw !== undefined && raw !== "" && raw !== "all" && !Number.isFinite(categoryId)) {
      return res.status(400).json({ error: "INVALID_CATEGORY_ID" });
    }

    const searchRaw = req.query.search;
    const search =
      typeof searchRaw === "string" && searchRaw.trim().length > 0 ? searchRaw.trim() : null;

    const districtRaw = req.query.district;
    const district =
      typeof districtRaw === "string" && districtRaw.trim().length > 0 ? districtRaw.trim() : null;

    const pagination = parsePaginationQuery(req);
    if (pagination && "error" in pagination) {
      return res.status(400).json({ error: pagination.error });
    }

    // Params: $1=categoryId, $2=search, $3=district
    const listParams = [categoryId, search, district];

    if (pagination) {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      const countResult = await pool.query(
        `select count(*)::int as total ${placesListFromWhere}`,
        listParams
      );
      const total = countResult.rows[0]?.total ?? 0;
      const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

      const result = await pool.query(
        `select
           ${placeRowSelect},
           coalesce(
             (select pi.image_url from place_images pi
              where pi.place_id = tp.id and pi.is_cover = true
              limit 1),
             (select pi.image_url from place_images pi
              where pi.place_id = tp.id
              order by pi.id asc
              limit 1)
           ) as "coverImageUrl"
         ${placesListFromWhere}
         ${placesListOrderBy}
         limit $4 offset $5`,
        [...listParams, limit, offset]
      );

      return res.json({
        data: result.rows,
        meta: { page, limit, total, totalPages },
      });
    }

    const result = await pool.query(
      `select
         ${placeRowSelect},
         coalesce(
           (select pi.image_url from place_images pi
            where pi.place_id = tp.id and pi.is_cover = true
            limit 1),
           (select pi.image_url from place_images pi
            where pi.place_id = tp.id
            order by pi.id asc
            limit 1)
         ) as "coverImageUrl"
       ${placesListFromWhere}
       ${placesListOrderBy}`,
      listParams
    );
    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

placesRouter.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const placeResult = await pool.query(
      `select
         ${placeRowSelect},
         tp.created_at as "createdAt",
         tp.updated_at as "updatedAt"
       from tourist_places tp
       left join categories c on c.id = tp.category_id
       where tp.id = $1 and tp.is_active = true`,
      [id]
    );
    const place = placeResult.rows[0];
    if (!place) return res.status(404).json({ error: "NOT_FOUND" });

    const imagesResult = await pool.query(
      `select id, image_url as url, is_cover as "isCover"
       from place_images
       where place_id = $1
       order by is_cover desc, id asc`,
      [id]
    );

    const recommendedMenus = await loadRecommendedMenus(id);

    res.json({
      data: {
        ...place,
        images: imagesResult.rows,
        recommendedMenus,
      },
    });
  } catch (err) {
    next(err);
  }
});

placesRouter.post("/", async (req, res, next) => {
  try {
    const payload = placeCreateSchema.parse(req.body);
    const menuCheck = await menusForSave(payload);
    if ("error" in menuCheck) return res.status(400).json({ error: menuCheck.error });

    let coverIndex = payload.images.findIndex((img) => img.isCover === true);
    if (coverIndex < 0) coverIndex = 0;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const insertPlace = await client.query(
        `insert into tourist_places (${placeInsertColumns})
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
         returning id`,
        placeInsertParams(payload)
      );
      const placeId = insertPlace.rows[0].id as number;

      for (let i = 0; i < payload.images.length; i++) {
        const img = payload.images[i];
        const isCover = i === coverIndex;
        await client.query(
          `insert into place_images (place_id, image_url, is_cover)
           values ($1, $2, $3)`,
          [placeId, img.url, isCover]
        );
      }

      await replaceRecommendedMenus(client, placeId, menuCheck.menus);

      await client.query("COMMIT");

      const detail = await pool.query(
        `select
           ${placeRowSelect},
           tp.created_at as "createdAt",
           tp.updated_at as "updatedAt"
         from tourist_places tp
         left join categories c on c.id = tp.category_id
         where tp.id = $1`,
        [placeId]
      );
      const imagesResult = await pool.query(
        `select id, image_url as url, is_cover as "isCover"
         from place_images
         where place_id = $1
         order by is_cover desc, id asc`,
        [placeId]
      );

      res.status(201).json({
        data: {
          ...detail.rows[0],
          images: imagesResult.rows,
          recommendedMenus: menuCheck.menus,
        },
      });
    } catch (err) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

placesRouter.put("/:id", async (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "INVALID_ID" });

    const payload = placeReplaceSchema.parse(req.body);
    const menuCheck = await menusForSave(payload);
    if ("error" in menuCheck) return res.status(400).json({ error: menuCheck.error });

    let coverIndex = payload.images.findIndex((img) => img.isCover === true);
    if (coverIndex < 0) coverIndex = 0;

    const exists = await pool.query(`select id from tourist_places where id = $1`, [id]);
    if (!exists.rows[0]) return res.status(404).json({ error: "NOT_FOUND" });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const p = placeInsertParams(payload);
      await client.query(
        `update tourist_places
         set name = $1,
             description = $2,
             category_id = $3,
             google_maps_url = $4,
             facebook_url = $5,
             line_url = $6,
             district = $7,
             address = $8,
             opening_hours = $9,
             best_visit_time = $10,
             ticket_price = $11,
             activities = $12,
             suitable_for = $13,
             highlights = $14,
             faq = $15,
             is_must_visit = $16,
             is_recommended_first_trip = $17,
             estimated_visit_hours = $18,
             display_order = $19,
             updated_at = now()
         where id = $20`,
        [...p, id]
      );

      await client.query(`delete from place_images where place_id = $1`, [id]);

      for (let i = 0; i < payload.images.length; i++) {
        const img = payload.images[i];
        const isCover = i === coverIndex;
        await client.query(
          `insert into place_images (place_id, image_url, is_cover)
           values ($1, $2, $3)`,
          [id, img.url, isCover]
        );
      }

      await replaceRecommendedMenus(client, id, menuCheck.menus);

      await client.query("COMMIT");

      const detail = await pool.query(
        `select
           ${placeRowSelect},
           tp.created_at as "createdAt",
           tp.updated_at as "updatedAt"
         from tourist_places tp
         left join categories c on c.id = tp.category_id
         where tp.id = $1`,
        [id]
      );
      const imagesResult = await pool.query(
        `select id, image_url as url, is_cover as "isCover"
         from place_images
         where place_id = $1
         order by is_cover desc, id asc`,
        [id]
      );

      res.json({
        data: {
          ...detail.rows[0],
          images: imagesResult.rows,
          recommendedMenus: menuCheck.menus,
        },
      });
    } catch (err) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

placesRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "INVALID_ID" });

    const result = await pool.query(`delete from tourist_places where id = $1`, [id]);
    if (!result.rowCount) return res.status(404).json({ error: "NOT_FOUND" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
