import { env } from "../lib/env";
import { http } from "../lib/http";
import type { LocalFood, ProvinceInfo, StayZone, TravelGuide } from "../types";

const base = env.apiBaseUrl.replace(/\/$/, "");

type ListResponse<T> = { data: T[] };
type ItemResponse<T> = { data: T };

export const knowledgeApi = {
  localFoods: {
    async list(): Promise<LocalFood[]> {
      const res = await http<ListResponse<LocalFood>>(`${base}/api/knowledge/local-foods`);
      return res.data;
    },
    async create(input: Omit<LocalFood, "id">): Promise<LocalFood> {
      const res = await http<ItemResponse<LocalFood>>(`${base}/api/knowledge/local-foods`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      return res.data;
    },
    async update(id: number, input: Omit<LocalFood, "id">): Promise<LocalFood> {
      const res = await http<ItemResponse<LocalFood>>(`${base}/api/knowledge/local-foods/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      return res.data;
    },
    async remove(id: number): Promise<void> {
      await http(`${base}/api/knowledge/local-foods/${id}`, { method: "DELETE" });
    },
  },
  stayZones: {
    async list(): Promise<StayZone[]> {
      const res = await http<ListResponse<StayZone>>(`${base}/api/knowledge/stay-zones`);
      return res.data;
    },
    async create(input: Omit<StayZone, "id">): Promise<StayZone> {
      const res = await http<ItemResponse<StayZone>>(`${base}/api/knowledge/stay-zones`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      return res.data;
    },
    async update(id: number, input: Omit<StayZone, "id">): Promise<StayZone> {
      const res = await http<ItemResponse<StayZone>>(`${base}/api/knowledge/stay-zones/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      return res.data;
    },
    async remove(id: number): Promise<void> {
      await http(`${base}/api/knowledge/stay-zones/${id}`, { method: "DELETE" });
    },
  },
  travelGuides: {
    async list(): Promise<TravelGuide[]> {
      const res = await http<ListResponse<TravelGuide>>(`${base}/api/knowledge/travel-guides`);
      return res.data;
    },
    async create(input: Omit<TravelGuide, "id">): Promise<TravelGuide> {
      const res = await http<ItemResponse<TravelGuide>>(`${base}/api/knowledge/travel-guides`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      return res.data;
    },
    async update(id: number, input: Omit<TravelGuide, "id">): Promise<TravelGuide> {
      const res = await http<ItemResponse<TravelGuide>>(`${base}/api/knowledge/travel-guides/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      return res.data;
    },
    async remove(id: number): Promise<void> {
      await http(`${base}/api/knowledge/travel-guides/${id}`, { method: "DELETE" });
    },
  },
  provinceInfo: {
    async get(): Promise<ProvinceInfo> {
      const res = await http<ItemResponse<ProvinceInfo>>(`${base}/api/knowledge/province-info`);
      return res.data;
    },
    async update(input: Omit<ProvinceInfo, "id" | "updatedAt">): Promise<ProvinceInfo> {
      const res = await http<ItemResponse<ProvinceInfo>>(`${base}/api/knowledge/province-info`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      return res.data;
    },
  },
};
