import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { storeImage } from "@/lib/imageStorage";
import { removeBackground } from "@/lib/removeBackground";

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

  const removed = await removeBackground(file);
  if (!removed.removed || !removed.file) {
    return NextResponse.json({ url: "", warning: removed.warning });
  }

  const stored = await storeImage(removed.file);
  return NextResponse.json({ ...stored, warning: stored.warning });
}
