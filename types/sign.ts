export type SignRecord = {
  id: string;
  image_original_url: string;
  image_processed_url: string;
  sign_title: string;
  restaurant_name: string;
  place_id: string;
  formatted_address: string;
  latitude: string;
  longitude: string;
  google_maps_url: string;
  borough: string;
  neighborhood: string;
  designer: string;
  notes: string;
  tags: string;
  date_collected: string;
  date_visited: string;
  created_at: string;
  updated_at: string;
  published: boolean;
};

export type SignInput = Omit<SignRecord, "id" | "created_at" | "updated_at"> & {
  id?: string;
};

export const SHEET_COLUMNS = [
  "id",
  "image_original_url",
  "image_processed_url",
  "sign_title",
  "restaurant_name",
  "place_id",
  "formatted_address",
  "latitude",
  "longitude",
  "google_maps_url",
  "borough",
  "neighborhood",
  "notes",
  "tags",
  "date_collected",
  "created_at",
  "updated_at",
  "published",
  "designer",
  "date_visited",
] as const;
