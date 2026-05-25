import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { createSign, listSigns } from "@/lib/googleSheets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const all = url.searchParams.get("all") === "1";
  const signs = await listSigns({ publishedOnly: !all });
  return NextResponse.json({ signs });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = await createSign({
    image_original_url: body.image_original_url || "",
    image_processed_url: body.image_processed_url || body.image_original_url || "",
    sign_title: "",
    restaurant_name: body.restaurant_name || "",
    place_id: body.place_id || "",
    formatted_address: body.formatted_address || "",
    latitude: body.latitude || "",
    longitude: body.longitude || "",
    google_maps_url: body.google_maps_url || "",
    borough: body.borough || "",
    neighborhood: body.neighborhood || "",
    designer: body.designer || "",
    notes: body.notes || "",
    tags: body.tags || "",
    date_collected: body.date_collected || body.date_visited || "",
    date_visited: body.date_visited || body.date_collected || "",
    published: Boolean(body.published),
  });

  return NextResponse.json(result);
}
