import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { createSign, deleteSign, listSigns, updateSign } from "@/lib/googleSheets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const all = url.searchParams.get("all") === "1";
  if (all && !(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const signs = await listSigns({ publishedOnly: !all });
  return NextResponse.json({ signs });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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
      restaurant_website_url: body.restaurant_website_url || "",
      borough: body.borough || "",
      neighborhood: body.neighborhood || "",
      designer: body.designer || "",
      designer_url: body.designer_url || "",
      notes: body.notes || "",
      tags: body.tags || "",
      date_collected: body.date_collected || body.date_visited || "",
      date_visited: body.date_visited || body.date_collected || "",
      published: Boolean(body.published),
      status: body.status || (body.published ? "approved" : "draft"),
      submitted_at: body.submitted_at || "",
      restaurants_using_design: body.restaurants_using_design || "",
      submitter_name: body.submitter_name || "Gibson Chu",
      featured: Boolean(body.featured),
      sort_order: body.sort_order || "",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to save sign", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save sign" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "Missing sign id" }, { status: 400 });

    const result = await updateSign(body.id, {
      image_original_url: body.image_original_url || "",
      image_processed_url: body.image_processed_url || body.image_original_url || "",
      sign_title: "",
      restaurant_name: body.restaurant_name || "",
      place_id: body.place_id || "",
      formatted_address: body.formatted_address || "",
      latitude: body.latitude || "",
      longitude: body.longitude || "",
      google_maps_url: body.google_maps_url || "",
      restaurant_website_url: body.restaurant_website_url || "",
      borough: body.borough || "",
      neighborhood: body.neighborhood || "",
      designer: body.designer || "",
      designer_url: body.designer_url || "",
      notes: body.notes || "",
      tags: body.tags || "",
      date_collected: body.date_collected || body.date_visited || "",
      date_visited: body.date_visited || body.date_collected || "",
      published: Boolean(body.published),
      status: body.status || (body.published ? "approved" : "draft"),
      submitted_at: body.submitted_at || "",
      restaurants_using_design: body.restaurants_using_design || "",
      submitter_name: body.submitter_name || "Gibson Chu",
      featured: Boolean(body.featured),
      sort_order: body.sort_order || "",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to update sign", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update sign" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing sign id" }, { status: 400 });

    const result = await deleteSign(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to delete sign", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete sign" },
      { status: 500 },
    );
  }
}
