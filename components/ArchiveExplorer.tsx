"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SignGrid } from "@/components/SignGrid";
import type { SignRecord } from "@/types/sign";

const BOROUGH_ORDER = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island", "New Jersey", "Unknown"];

function boroughFor(sign: SignRecord) {
  return sign.borough || "Unknown";
}

function searchableText(sign: SignRecord) {
  return sign.restaurant_name.toLowerCase();
}

export function ArchiveExplorer({ signs }: { signs: SignRecord[] }) {
  const [borough, setBorough] = useState("All");
  const [query, setQuery] = useState("");

  const boroughs = useMemo(() => {
    const available = new Set(signs.map(boroughFor));
    return ["All", ...BOROUGH_ORDER.filter((item) => available.has(item))];
  }, [signs]);

  const filteredSigns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return signs.filter((sign) => {
      const matchesBorough = borough === "All" || boroughFor(sign) === borough;
      const matchesQuery =
        !normalizedQuery ||
        normalizedQuery
          .split(/\s+/)
          .every((term) => searchableText(sign).includes(term));
      return matchesBorough && matchesQuery;
    });
  }, [borough, query, signs]);

  return (
    <div className="min-h-screen bg-[#fdfdf9] text-[#151515] md:grid md:grid-cols-[320px_1fr]">
      <aside className="border-b border-black/10 p-6 md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r md:p-10">
        <h1 className="display-title max-w-[13rem] text-[2rem] leading-[0.9] tracking-normal md:text-[2.55rem]">
          Choking Hazard Signs
        </h1>
        <p className="mt-5 max-w-[14rem] text-sm leading-6 text-black/55">
          An archive of choking hazard signs around New York City.
        </p>

        <nav className="mt-11 grid gap-9">
          <label className="grid gap-2">
            <span className="font-mono text-[11px] uppercase text-black/40">Search</span>
            <input
              className="w-full border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black"
              placeholder="Restaurant name"
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
            <Link className="mt-3 w-fit border border-black bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-white hover:text-black" href="/submit">
              Spotted One? Submit It
            </Link>
          </div>

          <p className="font-mono text-[11px] uppercase text-black/45">{filteredSigns.length} signs</p>
        </nav>
      </aside>

      <section className="px-5 py-8 md:px-12 md:py-14">
        {filteredSigns.length > 0 ? (
          <SignGrid signs={filteredSigns} />
        ) : (
          <div className="border border-black/10 px-4 py-12 text-center text-sm text-black/60">
            No signs match this search.
          </div>
        )}
      </section>
    </div>
  );
}
