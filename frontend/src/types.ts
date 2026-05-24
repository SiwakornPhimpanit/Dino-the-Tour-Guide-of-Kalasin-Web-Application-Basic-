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

export type PlacesListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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

export type LocalFood = {
  id: number;
  name: string;
  description: string | null;
  whereToEat: string | null;
  priceRange: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type StayZone = {
  id: number;
  zoneName: string;
  summary: string | null;
  pros: string | null;
  cons: string | null;
  suitableFor: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type TravelGuide = {
  id: number;
  topic: string;
  title: string;
  content: string;
  sortOrder: number;
  isActive: boolean;
};

export type ProvinceInfo = {
  id: number;
  summary: string | null;
  isFamilyFriendly: boolean;
  familyFriendlyNote: string | null;
  firstTimeTips: string | null;
  bestSeason: string | null;
  updatedAt: string;
};
