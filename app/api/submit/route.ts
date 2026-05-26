import { NextResponse } from "next/server";
import { createSign } from "@/lib/googleSheets";
import { storeImage } from "@/lib/imageStorage";

export const runtime = "nodejs";

function text(form: FormData, key: string) {
  return String(form.get(key) || "").trim();
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please add an image." }, { status: 400 });
    }

    const restaurantName = text(form, "restaurant_name");
    if (!restaurantName) {
      return NextResponse.json({ error: "Please add a restaurant name." }, { status: 400 });
    }

    const image = await storeImage(file);
    const now = new Date().toISOString();
    const result = await createSign({
      image_original_url: image.url,
      image_processed_url: image.url,
      sign_title: "",
      restaurant_name: restaurantName,
      place_id: text(form, "place_id"),
      formatted_address: text(form, "formatted_address"),
      latitude: text(form, "latitude"),
      longitude: text(form, "longitude"),
      google_maps_url: text(form, "google_maps_url"),
      restaurant_website_url: text(form, "restaurant_website_url"),
      borough: text(form, "borough"),
      neighborhood: text(form, "neighborhood"),
      designer: text(form, "designer"),
      designer_url: text(form, "designer_url"),
      notes: text(form, "notes"),
      tags: text(form, "tags"),
      date_collected: text(form, "date_visited"),
      date_visited: text(form, "date_visited"),
      published: false,
      status: "pending",
      submitted_at: now,
      usability_rating: text(form, "usability_rating"),
      submitter_name: text(form, "submitter_name") || "Gibson Chu",
      featured: false,
    });

    return NextResponse.json({
      ...result,
      message: "Submitted for review.",
      warning: image.warning || result.warning,
    });
  } catch (error) {
    console.error("Failed to submit sign", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit sign" },
      { status: 500 },
    );
  }
}
