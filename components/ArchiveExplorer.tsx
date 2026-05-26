"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SignGrid } from "@/components/SignGrid";
import type { SignRecord } from "@/types/sign";

const BOROUGH_ORDER = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island", "Unknown"];

function boroughFor(sign: SignRecord) {
  return sign.borough || "Unknown";
}

function searchableText(sign: SignRecord) {
  return [
    sign.restaurant_name,
    sign.designer,
    sign.borough,
    sign.neighborhood,
    sign.notes,
    sign.tags,
    sign.formatted_address,
  ]
    .join(" ")
    .toLowerCase();
}

export function ArchiveExplorer({ signs }: { signs: SignRecord[] }) {
  const [borough, setBorough] = useState("All");
  const [query, setQuery] = useState("");
  const featured = signs[0];

  const boroughs = useMemo(() => {
    const available = new Set(signs.map(boroughFor));
    return ["All", ...BOROUGH_ORDER.filter((item) => available.has(item))];
  }, [signs]);

  const filteredSigns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return signs.filter((sign) => {
      const matchesBorough = borough === "All" || boroughFor(sign) === borough;
      const matchesQuery = !normalizedQuery || searchableText(sign).includes(normalizedQuery);
      return matchesBorough && matchesQuery;
    });
  }, [borough, query, signs]);

  const gridSigns = featured && !query.trim() && borough === "All"
    ? filteredSigns.filter((sign) => sign.id !== featured.id)
    : filteredSigns;

  return (
    <div className="min-h-screen bg-[#fdfdf9] text-[#151515] md:grid md:grid-cols-[270px_1fr]">
      <aside className="border-b border-black/10 p-5 md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r md:p-7">
        <h1 className="max-w-[10rem] text-2xl font-semibold leading-[0.95] tracking-normal md:text-3xl">
          Choking Hazard Signs
        </h1>
        <p className="mt-4 max-w-[13rem] text-sm leading-5 text-black/55">
          An archive of choking hazard signs around New York City.
        </p>

        <nav className="mt-8 grid gap-7">
          <label className="grid gap-2">
            <span className="font-mono text-[11px] uppercase text-black/40">Search</span>
            <input
              className="w-full border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black"
              placeholder="Restaurant, tag, note"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <div className="grid gap-1">
            <p className="mb-2 font-mono text-[11px] uppercase text-black/40">Borough</p>
            {boroughs.map((item) => (
              <button
                key={item}
                type="button"
                className={`w-fit text-left text-lg leading-tight ${
                  item === borough ? "font-semibold text-black" : "font-semibold text-black/45 hover:text-black"
                }`}
                onClick={() => setBorough(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="grid gap-1">
            <p className="mb-2 font-mono text-[11px] uppercase text-black/40">View</p>
            <span className="text-lg font-semibold text-black">Archive</span>
            <Link className="text-lg font-semibold text-black/45 hover:text-black" href="/map">Map</Link>
            <Link className="text-lg font-semibold text-black/45 hover:text-black" href="/about">About</Link>
            <Link className="text-lg font-semibold text-black/45 hover:text-black" href="/submit">Spotted one? Submit it</Link>
          </div>

          <p className="font-mono text-[11px] uppercase text-black/45">{filteredSigns.length} signs</p>
        </nav>
      </aside>

      <section className="px-4 py-6 md:px-8 md:py-10">
        {featured && !query.trim() && borough === "All" && (
          <Link
            className="mb-12 grid gap-6 border-b border-black/10 pb-10 md:grid-cols-[minmax(220px,360px)_minmax(0,1fr)]"
            href={`/sign/${featured.id}`}
          >
            <div className="bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={featured.image_processed_url || featured.image_original_url}
                alt={featured.restaurant_name || "Featured sign"}
                className="mx-auto max-h-[460px] w-full object-contain p-3"
              />
            </div>
            <div className="flex max-w-xl flex-col justify-end pb-2">
              <p className="font-mono text-[11px] uppercase text-black/45">Featured sign</p>
              <h2 className="mt-3 text-4xl font-semibold leading-none md:text-6xl">
                {featured.restaurant_name || "Unknown restaurant"}
              </h2>
              <p className="mt-5 text-sm leading-6 text-black/60">
                {[featured.borough, featured.date_visited || featured.date_collected].filter(Boolean).join(" / ") ||
                  "Location pending"}
              </p>
              {featured.notes && <p className="mt-5 max-w-md text-base leading-7 text-black/70">{featured.notes}</p>}
            </div>
          </Link>
        )}

        {gridSigns.length > 0 ? (
          <SignGrid signs={gridSigns} />
        ) : (
          <div className="border border-black/10 px-4 py-12 text-center text-sm text-black/60">
            {featured && !query.trim() && borough === "All"
              ? "More signs will appear here as the archive grows."
              : "No signs match this search."}
          </div>
        )}
      </section>
    </div>
  );
}
