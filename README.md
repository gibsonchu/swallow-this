# Choking Hazard Signs

A minimal public archive of choking hazard signs collected around New York City. Built with Next.js App Router, TypeScript, Tailwind CSS, Google Sheets, Vercel Blob, and Google Maps Places Autocomplete.

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
id,image_original_url,image_processed_url,sign_title,restaurant_name,place_id,formatted_address,latitude,longitude,google_maps_url,restaurant_website_url,borough,neighborhood,notes,tags,date_collected,created_at,updated_at,published,designer,date_visited,status,submitted_at,designer_url,restaurants_using_design,submitter_name,featured,sort_order
```

The app reads rows on the `Signs` tab and writes new signs to explicit rows. Latitude and longitude are stored as map plumbing; the admin and public submission flow focus on restaurant, place search, website links, borough, neighborhood, designer, restaurants using the same design, notes, tags, date visited, submitter name, custom `sort_order`, published, `status`, and `submitted_at`. Public submissions are saved as `status=pending` and `published=FALSE`.

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
- `GOOGLE_MAPS_API_KEY`: Legacy/browser Maps key, kept for compatibility.
- `GOOGLE_PLACES_SERVER_API_KEY`: Server-side Places key used by autocomplete and place details. Enable Places API (New) and keep application restrictions compatible with server-side requests.
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob token for persistent public image storage.
## Routes

- `/`: Public archive, published signs only.
- `/sign/[id]`: Public sign detail page.
- `/map`: Public map view for published signs with latitude/longitude.
- `/about`: Article-style project description.
- `/submit`: Redirects to @gibsontchu on X for submission requests.
- `/admin`: Password-gated admin upload and metadata dashboard.
- `/api/signs`: `GET` published signs, authenticated `GET ?all=1` all signs, authenticated `POST` create sign, authenticated `PATCH` update sign, authenticated `DELETE` clear sign row.
- `/api/submit`: Public submissions are closed and return `410 Gone`.
- `/api/upload`: Authenticated image upload.
- `/api/admin/login`: Admin login.
- `/api/admin/logout`: Admin logout.
