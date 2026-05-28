export type PlacesListQueryOptions = {
  categoryId?: string | null;
  search?: string | null;
  district?: string | null;
  page?: number;
  limit?: number;
};

/** Build query string for GET /api/places */
export function buildPlacesListQuery(options: PlacesListQueryOptions = {}): string {
  const { categoryId, search, district, page, limit } = options;
  const params = new URLSearchParams();
  if (categoryId && categoryId !== "all") params.set("category_id", categoryId);
  const q = search?.trim();
  if (q) params.set("search", q);
  const d = district?.trim();
  if (d) params.set("district", d);
  if (page !== undefined) params.set("page", String(page));
  if (limit !== undefined) params.set("limit", String(limit));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
