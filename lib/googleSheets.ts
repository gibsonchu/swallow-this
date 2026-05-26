import { createSign as createJwtSign } from "node:crypto";
import { mockSigns } from "@/lib/mockSigns";
import { SHEET_COLUMNS, type SignInput, type SignRecord } from "@/types/sign";

let tokenCache: { token: string; expiresAt: number } | null = null;

function hasSheetsEnv() {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_SHEET_ID,
  );
}

function base64url(input: string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signJwt(unsignedJwt: string) {
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!key) throw new Error("GOOGLE_PRIVATE_KEY is missing.");

  const signer = createJwtSign("RSA-SHA256");
  signer.update(unsignedJwt);
  signer.end();
  return signer
    .sign(key)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function getAccessToken() {
  if (!hasSheetsEnv()) return null;
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    }),
  );
  const unsignedJwt = `${header}.${claim}`;
  const assertion = `${unsignedJwt}.${signJwt(unsignedJwt)}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google auth failed with ${response.status}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return tokenCache.token;
}

async function sheetsFetch(path: string, init?: RequestInit) {
  const token = await getAccessToken();
  if (!token) return null;

  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Google Sheets request failed with ${response.status}`);
  }

  return response;
}

function parseBoolean(value: unknown) {
  return String(value).toLowerCase() === "true";
}

const DEFAULT_SUBMITTER_NAME = "Gibson Chu";

function rowToSign(row: string[]): SignRecord {
  const record = Object.fromEntries(
    SHEET_COLUMNS.map((column, index) => [column, row[index] ?? ""]),
  ) as unknown as SignRecord;

  return {
    ...record,
    published: parseBoolean(record.published),
    status: record.status || (parseBoolean(record.published) ? "approved" : "draft"),
    submitted_at: record.submitted_at || "",
    restaurant_website_url: record.restaurant_website_url || "",
    designer_url: record.designer_url || "",
    restaurants_using_design: record.restaurants_using_design || "",
    submitter_name: record.submitter_name || DEFAULT_SUBMITTER_NAME,
    featured: parseBoolean(record.featured),
    sort_order: record.sort_order || "",
  };
}

function signToRow(sign: SignRecord) {
  return SHEET_COLUMNS.map((column) =>
    column === "published" || column === "featured"
      ? String(Boolean(sign[column])).toUpperCase()
      : String(sign[column] ?? ""),
  );
}

async function getSheetRows() {
  const response = await sheetsFetch(
    `${process.env.GOOGLE_SHEET_ID}/values/${encodeURIComponent("Signs!A:AB")}`,
  );
  if (!response) return [];

  const data = (await response.json()) as { values?: string[][] };
  return data.values ?? [];
}

function rowsToSigns(rows: string[][]) {
  const dataRows = rows[0]?.[0] === "id" ? rows.slice(1) : rows;
  return dataRows
    .map(rowToSign)
    .filter((sign) => sign.id || sign.image_original_url || sign.restaurant_name);
}

function rowNumberForId(rows: string[][], id: string) {
  const index = rows.findIndex((row) => row[0] === id);
  return index === -1 ? null : index + 1;
}

async function clearFeaturedExcept(id: string) {
  const rows = await getSheetRows();
  const dataRows = rows[0]?.[0] === "id" ? rows.slice(1) : rows;
  const startRow = rows[0]?.[0] === "id" ? 2 : 1;
  const values = dataRows
    .map((row, index) => ({ rowNumber: startRow + index, sign: rowToSign(row) }))
    .filter(({ sign }) => sign.id && sign.id !== id && sign.featured)
    .map(({ rowNumber }) => ({
      range: `Signs!AA${rowNumber}`,
      values: [["FALSE"]],
    }));

  if (values.length === 0) return;

  await sheetsFetch(`${process.env.GOOGLE_SHEET_ID}/values:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      valueInputOption: "USER_ENTERED",
      data: values,
    }),
  });
}

export async function listSigns(options: { publishedOnly?: boolean } = {}) {
  const fallback = options.publishedOnly ? mockSigns.filter((sign) => sign.published) : mockSigns;

  if (!hasSheetsEnv()) {
    return fallback;
  }

  try {
    const signs = rowsToSigns(await getSheetRows());
    return options.publishedOnly ? signs.filter((sign) => sign.published) : signs;
  } catch (error) {
    console.warn("Google Sheets read failed; using mock signs.", error);
    return fallback;
  }
}

export async function getSignById(id: string) {
  const signs = await listSigns({ publishedOnly: true });
  return signs.find((sign) => sign.id === id) ?? null;
}

export async function createSign(input: SignInput) {
  const now = new Date().toISOString();
  const sign: SignRecord = {
    ...input,
    id: input.id || crypto.randomUUID(),
    image_processed_url: input.image_processed_url || input.image_original_url,
    created_at: now,
    updated_at: now,
    published: Boolean(input.published),
    status: input.status || (input.published ? "approved" : "draft"),
    submitted_at: input.submitted_at || "",
    restaurant_website_url: input.restaurant_website_url || "",
    designer_url: input.designer_url || "",
    restaurants_using_design: input.restaurants_using_design || "",
    submitter_name: input.submitter_name || DEFAULT_SUBMITTER_NAME,
    featured: Boolean(input.featured),
    sort_order: input.sort_order || "",
  };

  if (!hasSheetsEnv()) {
    return { sign, stored: false, warning: "Google Sheets env vars are missing; returning mock save." };
  }

  const rows = await getSheetRows();
  const nextRowNumber = rows.length + 1;
  if (!sign.sort_order) sign.sort_order = String(Math.max(nextRowNumber - 1, 1));

  const writeResponse = await sheetsFetch(
    `${process.env.GOOGLE_SHEET_ID}/values/${encodeURIComponent(
      `Signs!A${nextRowNumber}:AB${nextRowNumber}`,
    )}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      body: JSON.stringify({
        values: [signToRow(sign)],
      }),
    },
  );
  const writeData = writeResponse ? ((await writeResponse.json()) as { updatedRange?: string }) : {};
  if (sign.featured) await clearFeaturedExcept(sign.id);

  return { sign, stored: true, updatedRange: writeData.updatedRange };
}

export async function updateSign(id: string, input: Partial<SignInput>) {
  const rows = await getSheetRows();
  const rowNumber = rowNumberForId(rows, id);
  if (!rowNumber) throw new Error("Sign not found");

  const existing = rowToSign(rows[rowNumber - 1]);
  const now = new Date().toISOString();
  const sign: SignRecord = {
    ...existing,
    ...input,
    id,
    image_processed_url: input.image_processed_url || existing.image_processed_url || input.image_original_url || existing.image_original_url,
    created_at: existing.created_at,
    updated_at: now,
    published: Boolean(input.published),
    status: input.status || existing.status || (input.published ? "approved" : "draft"),
    submitted_at: input.submitted_at || existing.submitted_at || "",
    restaurant_website_url: input.restaurant_website_url || existing.restaurant_website_url || "",
    designer_url: input.designer_url || existing.designer_url || "",
    restaurants_using_design: input.restaurants_using_design || existing.restaurants_using_design || "",
    submitter_name: input.submitter_name || existing.submitter_name || DEFAULT_SUBMITTER_NAME,
    featured: Boolean(input.featured),
    sort_order: input.sort_order ?? existing.sort_order ?? "",
  };

  const writeResponse = await sheetsFetch(
    `${process.env.GOOGLE_SHEET_ID}/values/${encodeURIComponent(`Signs!A${rowNumber}:AB${rowNumber}`)}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      body: JSON.stringify({ values: [signToRow(sign)] }),
    },
  );
  const writeData = writeResponse ? ((await writeResponse.json()) as { updatedRange?: string }) : {};
  if (sign.featured) await clearFeaturedExcept(sign.id);

  return { sign, stored: true, updatedRange: writeData.updatedRange };
}

export async function deleteSign(id: string) {
  const rows = await getSheetRows();
  const rowNumber = rowNumberForId(rows, id);
  if (!rowNumber) throw new Error("Sign not found");

  const sign = rowToSign(rows[rowNumber - 1]);
  await sheetsFetch(
    `${process.env.GOOGLE_SHEET_ID}/values/${encodeURIComponent(`Signs!A${rowNumber}:AB${rowNumber}`)}:clear`,
    { method: "POST", body: JSON.stringify({}) },
  );

  return { sign, deleted: true };
}
