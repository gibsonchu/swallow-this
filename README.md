# Swallow This

A minimal public archive of choking hazard signs collected around New York City. Built with Next.js App Router, TypeScript, Tailwind CSS, Google Sheets, Vercel Blob, Google Maps Places Autocomplete, and optional remove.bg background removal.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Fill in any available values. The app runs without external keys using mock archive data and data URL image fallbacks.

4. Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

Default local admin fallback: if `ADMIN_PASSWORD` is unset, use `dev-password`.

## Vercel deploy

1. Push this repo to GitHub.
2. Import it in Vercel as a Next.js project.
3. Add the environment variables from `.env.example`.
4. Deploy.

For production uploads, `BLOB_READ_WRITE_TOKEN` should be configured from a Vercel Blob store. Without it, uploads return temporary data URLs and are only useful for local MVP testing.

## Google Sheets setup

Create a Google Sheet with a tab named `Signs`.

Add this exact header row in row 1:

```text
id,image_original_url,image_processed_url,sign_title,restaurant_name,place_id,formatted_address,latitude,longitude,google_maps_url,borough,neighborhood,notes,tags,date_collected,created_at,updated_at,published
```

The app reads from `Signs!A2:R` and appends new rows to `Signs!A:R`.

## Google service account

1. Create a Google Cloud project.
2. Enable the Google Sheets API.
3. Create a service account.
4. Generate a JSON key.
5. Share the Google Sheet with the service account email as an editor.
6. Set:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` to the service account email.
   - `GOOGLE_PRIVATE_KEY` to the private key, preserving newline escapes as `\n`.
   - `GOOGLE_SHEET_ID` to the spreadsheet ID from the Sheet URL.

## Environment variables

- `ADMIN_PASSWORD`: Password for `/admin`; stored only server-side and checked through an HTTP-only cookie.
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Service account email for Sheets access.
- `GOOGLE_PRIVATE_KEY`: Service account private key.
- `GOOGLE_SHEET_ID`: Spreadsheet ID for the `Signs` sheet.
- `GOOGLE_MAPS_API_KEY`: Used by the admin Places Autocomplete box. Restrict this key to your deployed/admin domains in Google Cloud.
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob token for persistent public image storage.
- `REMOVE_BG_API_KEY`: remove.bg API key. If absent or failing, the admin can save the original image.

## Routes

- `/`: Public archive, published signs only.
- `/sign/[id]`: Public sign detail page.
- `/admin`: Password-gated admin upload and metadata dashboard.
- `/api/signs`: `GET` published signs, `GET ?all=1` all signs, authenticated `POST` create sign.
- `/api/upload`: Authenticated image upload.
- `/api/remove-background`: Authenticated background removal and processed image upload.
- `/api/admin/login`: Admin login.
- `/api/admin/logout`: Admin logout.
