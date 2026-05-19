export type Category = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type PlaceTravelFields = {
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
  estimatedVisitHours: number | null;
};

export type PlaceListItem = {
  id: number;
  name: string;
  description: string;
  googleMapsUrl: string | null;
  facebookUrl: string | null;
  lineUrl: string | null;
  categoryId: number | null;
  categoryName: string | null;
  coverImageUrl: string | null;
} & PlaceTravelFields;

export type PlaceImage = {
  id: number;
  url: string;
  isCover: boolean;
};

export type PlaceDetail = {
  id: number;
  name: string;
  description: string;
  googleMapsUrl: string | null;
  facebookUrl: string | null;
  lineUrl: string | null;
  categoryId: number | null;
  categoryName: string | null;
  createdAt: string;
  updatedAt: string;
  images: PlaceImage[];
} & PlaceTravelFields;

export type PlaceCreateInput = {
  name: string;
  description: string;
  categoryId: number;
  googleMapsUrl?: string | null;
  facebookUrl?: string | null;
  lineUrl?: string | null;
  images: { url: string; isCover?: boolean }[];
} & Partial<PlaceTravelFields>;
