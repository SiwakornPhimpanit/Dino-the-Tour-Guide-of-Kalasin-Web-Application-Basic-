import { env } from "../lib/env";
import { http } from "../lib/http";
import { buildPlacesListQuery } from "../lib/placesQuery";
import type { PlaceCreateInput, PlaceDetail, PlaceListItem, PlacesListMeta } from "../types";

type ListResponse = { data: PlaceListItem[]; meta?: PlacesListMeta };
type ItemResponse = { data: PlaceDetail };

export type PlacesListResult = {
  data: PlaceListItem[];
  meta?: PlacesListMeta;
};

const base = env.apiBaseUrl.replace(/\/$/, "");

export const placesApi = {
  async list(
    categoryId?: string | null,
    search?: string | null,
    district?: string | null,
    options?: { page?: number; limit?: number }
  ): Promise<PlacesListResult> {
    const qs = buildPlacesListQuery({
      categoryId: categoryId ?? null,
      search: search ?? null,
      district: district ?? null,
      page: options?.page,
      limit: options?.limit,
    });
    const res = await http<ListResponse>(`${base}/api/places${qs}`);
    return { data: res.data, meta: res.meta };
  },
  async get(id: string): Promise<PlaceDetail> {
    const res = await http<ItemResponse>(`${base}/api/places/${id}`);
    return res.data;
  },
  async create(input: PlaceCreateInput): Promise<PlaceDetail> {
    const res = await http<ItemResponse>(`${base}/api/places`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    return res.data;
  },
  async update(id: string, input: PlaceCreateInput): Promise<PlaceDetail> {
    const res = await http<ItemResponse>(`${base}/api/places/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    return res.data;
  },
  async remove(id: string): Promise<void> {
    await http(`${base}/api/places/${id}`, { method: "DELETE" });
  },
};
