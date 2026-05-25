import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { storeImage } from "@/lib/imageStorage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing image file" }, { status: 400 });
  }

  const result = await storeImage(file);
  return NextResponse.json(result);
}
