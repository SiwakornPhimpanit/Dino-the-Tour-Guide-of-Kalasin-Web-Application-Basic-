import { z } from "zod";
const imageInputSchema = z.object({
    url: z.string().url(),
    isCover: z.boolean().optional(),
});
const optionalUrlField = (message) => z.preprocess((val) => {
    if (val === undefined || val === null || val === "")
        return null;
    if (typeof val !== "string")
        return val;
    const t = val.trim();
    return t === "" ? null : t;
}, z.union([z.null(), z.string().url({ message }).max(2000)]));
const optionalTextField = (max) => z.preprocess((val) => {
    if (val === undefined || val === null || val === "")
        return null;
    if (typeof val !== "string")
        return val;
    const t = val.trim();
    return t === "" ? null : t;
}, z.union([z.null(), z.string().max(max)]));
const googleMapsUrlField = optionalUrlField("INVALID_MAPS_URL");
const facebookUrlField = optionalUrlField("INVALID_FACEBOOK_URL");
const lineUrlField = optionalUrlField("INVALID_LINE_URL");
const placeExtraFields = {
    district: optionalTextField(100),
    address: optionalTextField(500),
    openingHours: optionalTextField(500),
    bestVisitTime: optionalTextField(500),
    ticketPrice: optionalTextField(200),
    activities: optionalTextField(2000),
    suitableFor: optionalTextField(500),
    highlights: optionalTextField(1000),
    faq: optionalTextField(1000),
    isMustVisit: z.boolean().optional().default(false),
    isRecommendedFirstTrip: z.boolean().optional().default(false),
    estimatedVisitHours: z
        .preprocess((val) => {
        if (val === undefined || val === null || val === "")
            return null;
        if (typeof val === "number")
            return val;
        if (typeof val === "string") {
            const t = val.trim();
            if (t === "")
                return null;
            const n = Number(t);
            return Number.isFinite(n) ? n : val;
        }
        return val;
    }, z.union([z.null(), z.number().min(0).max(24)]))
        .optional(),
};
export const placeCreateSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().min(1),
    categoryId: z.number().int().positive(),
    googleMapsUrl: googleMapsUrlField.nullish(),
    facebookUrl: facebookUrlField.nullish(),
    lineUrl: lineUrlField.nullish(),
    images: z.array(imageInputSchema).min(1),
    ...placeExtraFields,
});
/** Full replacement payload for PUT /api/places/:id (same shape as create). */
export const placeReplaceSchema = placeCreateSchema;
