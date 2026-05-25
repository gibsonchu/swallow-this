import { put } from "@vercel/blob";

export async function storeImage(file: File) {
  const safeName = file.name.replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
  const pathname = `signs/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    const buffer = Buffer.from(await file.arrayBuffer());
    return {
      url: `data:${file.type || "application/octet-stream"};base64,${buffer.toString("base64")}`,
      pathname,
      stored: false,
      warning: "BLOB_READ_WRITE_TOKEN is missing; using an in-memory data URL fallback.",
    };
  }

  const blob = await put(pathname, file, {
    access: "public",
    contentType: file.type || "application/octet-stream",
  });

  return { url: blob.url, pathname: blob.pathname, stored: true };
}
