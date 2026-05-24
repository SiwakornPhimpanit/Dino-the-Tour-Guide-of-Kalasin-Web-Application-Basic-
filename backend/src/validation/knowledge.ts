import { z } from "zod";

const optionalText = (max: number) =>
  z.preprocess((val: unknown) => {
    if (val === undefined || val === null || val === "") return null;
    if (typeof val !== "string") return val;
    const t = val.trim();
    return t === "" ? null : t;
  }, z.union([z.null(), z.string().max(max)]));

const sortOrderField = z.number().int().min(0).max(9999).optional().default(0);
const isActiveField = z.boolean().optional().default(true);

export const localFoodCreateSchema = z.object({
  name: z.string().min(1).max(255),
  description: optionalText(2000),
  whereToEat: optionalText(500),
  priceRange: optionalText(80),
  sortOrder: sortOrderField,
  isActive: isActiveField,
});

export const localFoodUpdateSchema = localFoodCreateSchema;

export const stayZoneCreateSchema = z.object({
  zoneName: z.string().min(1).max(120),
  summary: optionalText(2000),
  pros: optionalText(2000),
  cons: optionalText(2000),
  suitableFor: optionalText(500),
  sortOrder: sortOrderField,
  isActive: isActiveField,
});

export const stayZoneUpdateSchema = stayZoneCreateSchema;

export const travelGuideCreateSchema = z.object({
  topic: z.string().min(1).max(80),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  sortOrder: sortOrderField,
  isActive: isActiveField,
});

export const travelGuideUpdateSchema = travelGuideCreateSchema;

export const provinceInfoUpdateSchema = z.object({
  summary: optionalText(5000),
  isFamilyFriendly: z.boolean().optional().default(true),
  familyFriendlyNote: optionalText(2000),
  firstTimeTips: optionalText(2000),
  bestSeason: optionalText(2000),
});
