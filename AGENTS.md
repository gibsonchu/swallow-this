# AGENTS.md

## Project

Swallow This is a Vercel-ready Next.js App Router site for archiving choking hazard signs around NYC.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Google Sheets as the database
- Vercel Blob for image storage
- Google Maps Places Autocomplete in the admin
- remove.bg for optional background removal

## Development notes

- Keep pages and API handlers under the root `app/` directory.
- Keep external service clients lazily initialized inside helper functions so `next build` works without production env vars.
- Public pages should gracefully fall back to mock data when Google Sheets env vars are missing.
- Uploads should gracefully fall back when Blob or remove.bg keys are missing.
- Do not expose `ADMIN_PASSWORD` client-side. Auth must stay server-side through HTTP-only cookies.
- Preserve the current visual direction: off-white background, dark text, minimal borders, dense image grid, simple typography, no glossy startup styling.

## Verification

Run before handing off meaningful changes:

```bash
npm run lint
npm run build
```
