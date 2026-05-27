import { put } from "@vercel/blob";

async function optimizeImage(file: File) {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return {
      buffer: Buffer.from(await file.arrayBuffer()),
      contentType: file.type || "application/octet-stream",
      extension: file.name.split(".").pop() || "bin",
      optimized: false,
    };
  }

  const input = Buffer.from(await file.arrayBuffer());

  try {
    const sharp = (await import("sharp")).default;
    const buffer = await sharp(input)
      .rotate()
      .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    return {
      buffer,
      contentType: "image/webp",
      extension: "webp",
      optimized: true,
    };
  } catch {
    return {
      buffer: input,
      contentType: file.type || "application/octet-stream",
      extension: file.name.split(".").pop() || "bin",
      optimized: false,
    };
  }
}

export async function storeImage(file: File) {
  const safeName = file.name.replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
  const optimizedImage = await optimizeImage(file);
  const baseName = safeName.replace(/\.[a-z0-9]+$/i, "");
  const pathname = `signs/${Date.now()}-${crypto.randomUUID()}-${baseName}.${optimizedImage.extension}`;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      url: `data:${optimizedImage.contentType};base64,${optimizedImage.buffer.toString("base64")}`,
      pathname,
      stored: false,
      warning: "BLOB_READ_WRITE_TOKEN is missing; using an in-memory data URL fallback.",
    };
  }

  const blob = await put(pathname, optimizedImage.buffer, {
    access: "public",
    contentType: optimizedImage.contentType,
  });

  return { url: blob.url, pathname: blob.pathname, stored: true, optimized: optimizedImage.optimized };
}
