import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Public submissions are closed. Please contact @gibsontchu." },
    { status: 410 },
  );
}
