"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SignGrid } from "@/components/SignGrid";
import { SignModal } from "@/components/SignModal";
import type { SignRecord } from "@/types/sign";

const BOROUGH_ORDER = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island", "New Jersey", "Unknown"];
type ViewMode = "icons" | "gallery";
type SortMode = "featured" | "az" | "recent";

function boroughFor(sign: SignRecord) {
  return sign.borough || "Unknown";
}

function searchableText(sign: SignRecord) {
  return sign.restaurant_name.toLowerCase();
}

function sortValue(sign: SignRecord) {
  const value = Number(sign.sort_order);
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

function dateValue(sign: SignRecord) {
  const time = new Date(sign.date_visited || sign.date_collected || sign.created_at || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function ArchiveExplorer({ signs }: { signs: SignRecord[] }) {
  const [borough, setBorough] = useState("All");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("icons");
  const [sortMode, setSortMode] = useState<SortMode>("featured");
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  const boroughs = useMemo(() => {
    const available = new Set(signs.map(boroughFor));
    return ["All", ...BOROUGH_ORDER.filter((item) => available.has(item))];
  }, [signs]);

  const filteredSigns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = signs.filter((sign) => {
      const matchesBorough = borough === "All" || boroughFor(sign) === borough;
      const matchesQuery =
        !normalizedQuery ||
        normalizedQuery
          .split(/\s+/)
          .every((term) => searchableText(sign).includes(term));
      return matchesBorough && matchesQuery;
    });

    return filtered.sort((a, b) => {
      if (sortMode === "az") return (a.restaurant_name || "").localeCompare(b.restaurant_name || "");
      if (sortMode === "recent") return dateValue(b) - dateValue(a);
      const byOrder = sortValue(a) - sortValue(b);
      return byOrder || (a.restaurant_name || "").localeCompare(b.restaurant_name || "");
    });
  }, [borough, query, signs, sortMode]);

  const safeGalleryIndex = Math.min(galleryIndex, Math.max(filteredSigns.length - 1, 0));
  const selectedGallerySign = filteredSigns[safeGalleryIndex] || filteredSigns[0];
  const activeModalSign = modalIndex === null ? null : filteredSigns[modalIndex];

  const openModal = (index: number) => setModalIndex(index);
  const prevIndex = (index: number) => (index - 1 + filteredSigns.length) % filteredSigns.length;
  const nextIndex = (index: number) => (index + 1) % filteredSigns.length;

  return (
    <div className="min-h-screen bg-[#fdfdf9] text-[#151515] md:grid md:grid-cols-[320px_1fr]">
      <aside className="border-b border-black/10 p-5 md:sticky md:top-0 md:h-screen md:border-b-0 md:p-10">
        <h1 className="display-title max-w-[15rem] text-[2rem] leading-[0.9] tracking-normal md:max-w-[13rem] md:text-[2.55rem]">
          Choking Hazard Signs
        </h1>

        <nav className="mt-8 grid gap-6 md:mt-11 md:gap-9">
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

          <p className="font-mono text-[11px] uppercase text-black/45">{filteredSigns.length} signs</p>

          <div>
            <p className="mb-2 font-mono text-[11px] uppercase text-black/40">Borough</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 md:grid md:gap-1">
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
          </div>

          <div>
            <p className="mb-2 font-mono text-[11px] uppercase text-black/40">View By</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 md:grid md:gap-1">
              {(["icons", "gallery"] as ViewMode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`w-fit text-left text-lg font-semibold capitalize leading-tight ${viewMode === item ? "text-black" : "text-black/45 hover:text-black"}`}
                  onClick={() => setViewMode(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 font-mono text-[11px] uppercase text-black/40">Sort</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 md:grid md:gap-1">
              {[
                ["featured", "Featured"],
                ["az", "A-Z"],
                ["recent", "Recent"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`w-fit text-left text-lg font-semibold leading-tight ${sortMode === value ? "text-black" : "text-black/45 hover:text-black"}`}
                  onClick={() => {
                    setSortMode(value as SortMode);
                    setGalleryIndex(0);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 font-mono text-[11px] uppercase text-black/40">Pages</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 md:grid md:gap-1">
              <span className="text-lg font-semibold text-black">Index</span>
              <Link className="text-lg font-semibold text-black/45 hover:text-black" href="/map">Map</Link>
              <Link className="text-lg font-semibold text-black/45 hover:text-black" href="/about">About</Link>
              <Link className="w-fit border border-black bg-black px-4 py-2 text-lg font-semibold leading-tight text-white hover:bg-white hover:text-black md:mt-3" href="/submit">
                Submit A Sign
              </Link>
            </div>
          </div>
        </nav>
      </aside>

      <section className="px-5 py-8 md:px-12 md:py-14">
        {filteredSigns.length > 0 && viewMode === "icons" ? (
          <SignGrid signs={filteredSigns} onSelect={openModal} />
        ) : filteredSigns.length > 0 && selectedGallerySign ? (
          <div className="grid min-h-[calc(100vh-180px)] place-items-center">
            <div className="grid justify-items-center gap-5">
              <button type="button" onClick={() => openModal(safeGalleryIndex)} className="group grid justify-items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedGallerySign.image_processed_url || selectedGallerySign.image_original_url}
                  alt={selectedGallerySign.restaurant_name || "Choking hazard sign"}
                  className="archive-image max-h-[62vh] max-w-[min(520px,74vw)] object-contain object-center transition group-hover:scale-[1.01]"
                />
                <span className="text-center">
                  <span className="display-title block text-xl leading-none">{selectedGallerySign.restaurant_name || "Unknown Restaurant"}</span>
                  <span className="mt-1 block font-mono text-[11px] uppercase text-black/45">
                    {[selectedGallerySign.borough, selectedGallerySign.date_visited || selectedGallerySign.date_collected].filter(Boolean).join(" / ") || "Unlabeled"}
                  </span>
                </span>
              </button>
              <div className="flex items-center gap-8 font-mono text-[12px] uppercase text-black/45">
                <button type="button" className="hover:text-black" onClick={() => setGalleryIndex((index) => prevIndex(index))}>
                  ← Prev
                </button>
                <span>
                  {safeGalleryIndex + 1} / {filteredSigns.length}
                </span>
                <button type="button" className="hover:text-black" onClick={() => setGalleryIndex((index) => nextIndex(index))}>
                  Next →
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-black/10 px-4 py-12 text-center text-sm text-black/60">
            No signs match this search.
          </div>
        )}
      </section>
      {activeModalSign && (
        <SignModal
          sign={activeModalSign}
          index={modalIndex ?? 0}
          total={filteredSigns.length}
          onClose={() => setModalIndex(null)}
          onPrev={() => setModalIndex((index) => (index === null ? null : prevIndex(index)))}
          onNext={() => setModalIndex((index) => (index === null ? null : nextIndex(index)))}
        />
      )}
    </div>
  );
}
