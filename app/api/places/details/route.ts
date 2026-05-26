import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlaceDetails = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  googleMapsUri?: string;
  websiteUri?: string;
};

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_PLACES_SERVER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GOOGLE_PLACES_SERVER_API_KEY is missing" }, { status: 400 });

  const body = await request.json();
  const placeId = String(body.place_id || "").trim();
  if (!placeId) return NextResponse.json({ error: "Missing place id" }, { status: 400 });

  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "id,displayName,formattedAddress,location,googleMapsUri,websiteUri",
    },
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
    return NextResponse.json(
      { error: errorBody.error?.message || `Google Places details failed with ${response.status}` },
      { status: response.status },
    );
  }

  const place = (await response.json()) as PlaceDetails;
  return NextResponse.json({
    place: {
      place_id: place.id || placeId,
      restaurant_name: place.displayName?.text || "",
      formatted_address: place.formattedAddress || "",
      latitude: place.location?.latitude === undefined ? "" : String(place.location.latitude),
      longitude: place.location?.longitude === undefined ? "" : String(place.location.longitude),
      google_maps_url: place.googleMapsUri || "",
      restaurant_website_url: place.websiteUri || "",
    },
  });
}
