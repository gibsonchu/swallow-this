import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GoogleSuggestion = {
  placePrediction?: {
    placeId?: string;
    text?: { text?: string };
    structuredFormat?: {
      mainText?: { text?: string };
      secondaryText?: { text?: string };
    };
  };
};

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY is missing" }, { status: 400 });

  const body = await request.json();
  const input = String(body.input || "").trim();
  if (input.length < 2) return NextResponse.json({ predictions: [] });

  const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text",
    },
    body: JSON.stringify({
      input,
      includedRegionCodes: ["us"],
      includedPrimaryTypes: ["restaurant", "cafe", "bakery", "bar"],
      locationBias: {
        rectangle: {
          low: { latitude: 40.4774, longitude: -74.2591 },
          high: { latitude: 40.9176, longitude: -73.7004 },
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      errorBody?.error?.message ||
      `Google Places autocomplete failed with ${response.status}. Enable Places API (New) for this API key.`;
    return NextResponse.json({ error: message }, { status: response.status });
  }

  const data = (await response.json()) as { suggestions?: GoogleSuggestion[] };
  const predictions = (data.suggestions || [])
    .map((suggestion) => suggestion.placePrediction)
    .filter(Boolean)
    .map((prediction) => ({
      place_id: prediction?.placeId || "",
      label: prediction?.text?.text || "",
      main_text: prediction?.structuredFormat?.mainText?.text || prediction?.text?.text || "",
      secondary_text: prediction?.structuredFormat?.secondaryText?.text || "",
    }))
    .filter((prediction) => prediction.place_id && prediction.label);

  return NextResponse.json({ predictions });
}
