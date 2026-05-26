import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlaceDetails = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  googleMapsUri?: string;
};

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY is missing" }, { status: 400 });

  const body = await request.json();
  const placeId = String(body.place_id || "").trim();
  if (!placeId) return NextResponse.json({ error: "Missing place id" }, { status: 400 });

  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "id,displayName,formattedAddress,location,googleMapsUri",
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      errorBody?.error?.message ||
      `Google Places details failed with ${response.status}. Enable Places API (New) for this API key.`;
    return NextResponse.json({ error: message }, { status: response.status });
  }

  const place = (await response.json()) as PlaceDetails;
  return NextResponse.json({
    place: {
      place_id: place.id || placeId,
      restaurant_name: place.displayName?.text || "",
      formatted_address: place.formattedAddress || "",
      latitude: place.location?.latitude ? String(place.location.latitude) : "",
      longitude: place.location?.longitude ? String(place.location.longitude) : "",
      google_maps_url: place.googleMapsUri || "",
    },
  });
}
