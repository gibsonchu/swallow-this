"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SignGrid } from "@/components/SignGrid";
import { SignModal } from "@/components/SignModal";
import { OptimizedSignImage } from "@/components/OptimizedSignImage";
import { SiteHeader } from "@/components/SiteHeader";
import type { SignRecord } from "@/types/sign";

type ViewMode = "icons" | "gallery";
type SortMode = "featured" | "az" | "recent";

function sortValue(sign: SignRecord) {
  const value = Number(sign.sort_order);
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

function dateValue(sign: SignRecord) {
  const time = new Date(sign.date_visited || sign.date_collected || sign.created_at || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function ArchiveExplorer({ signs }: { signs: SignRecord[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>("icons");
  const [sortMode, setSortMode] = useState<SortMode>("featured");
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const filteredSigns = useMemo(() => {
    return [...signs].sort((a, b) => {
      if (sortMode === "az") return (a.restaurant_name || "").localeCompare(b.restaurant_name || "");
      if (sortMode === "recent") return dateValue(b) - dateValue(a);
      const byOrder = sortValue(a) - sortValue(b);
      return byOrder || (a.restaurant_name || "").localeCompare(b.restaurant_name || "");
    });
  }, [signs, sortMode]);

  const safeGalleryIndex = Math.min(galleryIndex, Math.max(filteredSigns.length - 1, 0));
  const selectedGallerySign = filteredSigns[safeGalleryIndex] || filteredSigns[0];
  const activeModalSign = modalIndex === null ? null : filteredSigns[modalIndex];

  const openModal = (index: number) => setModalIndex(index);
  const prevIndex = (index: number) => (index - 1 + filteredSigns.length) % filteredSigns.length;
  const nextIndex = (index: number) => (index + 1) % filteredSigns.length;

  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      window.requestAnimationFrame(() => setViewMode("gallery"));
    }
  }, []);

  useEffect(() => {
    if (modalIndex !== null || viewMode !== "gallery" || filteredSigns.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setGalleryIndex((index) => (index - 1 + filteredSigns.length) % filteredSigns.length);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setGalleryIndex((index) => (index + 1) % filteredSigns.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredSigns.length, modalIndex, viewMode]);

  return (
    <div className="bg-[#fdfdf9] text-[#151515]">
      <SiteHeader active="library" />

      <section className={`px-5 md:px-10 ${viewMode === "gallery" ? "py-5 md:py-4" : "py-8 md:py-10"}`}>
        <div className={`flex flex-wrap justify-end gap-3 font-mono text-[11px] uppercase text-black/45 ${viewMode === "gallery" ? "mb-4" : "mb-8"}`}>
          <label className="flex items-center gap-2">
            <span>View</span>
            <select
              className="min-w-28 border border-black/15 bg-[#fdfdf9] px-3 py-2 font-sans text-sm normal-case text-black outline-none focus:border-black"
              value={viewMode}
              onChange={(event) => setViewMode(event.target.value as ViewMode)}
            >
              <option value="icons">Icons</option>
              <option value="gallery">Gallery</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span>Sort</span>
            <select
              className="min-w-32 border border-black/15 bg-[#fdfdf9] px-3 py-2 font-sans text-sm normal-case text-black outline-none focus:border-black"
              value={sortMode}
              onChange={(event) => {
                setSortMode(event.target.value as SortMode);
                setGalleryIndex(0);
              }}
            >
              <option value="featured">Featured</option>
              <option value="az">A-Z</option>
              <option value="recent">Recent</option>
            </select>
          </label>
        </div>
        {filteredSigns.length > 0 && viewMode === "icons" ? (
          <SignGrid signs={filteredSigns} onSelect={openModal} />
        ) : filteredSigns.length > 0 && selectedGallerySign ? (
          <div className="grid place-items-center">
            <div className="grid justify-items-center gap-4">
              <button
                type="button"
                onClick={() => openModal(safeGalleryIndex)}
                onTouchStart={(event) => {
                  touchStartX.current = event.touches[0]?.clientX ?? null;
                }}
                onTouchEnd={(event) => {
                  if (touchStartX.current === null) return;
                  const delta = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
                  touchStartX.current = null;
                  if (Math.abs(delta) < 40) return;
                  setGalleryIndex((index) => (delta > 0 ? prevIndex(index) : nextIndex(index)));
                }}
                className="group grid touch-pan-y justify-items-center gap-4"
              >
                <OptimizedSignImage
                  src={selectedGallerySign.image_processed_url || selectedGallerySign.image_original_url}
                  alt={selectedGallerySign.restaurant_name || "Choking hazard sign"}
                  priority
                  quality={75}
                  sizes="(min-width: 768px) 520px, 74vw"
                  className="h-[44vh] max-h-[44vh] w-[min(460px,72vw)] md:h-[46vh] md:max-h-[46vh]"
                  imageClassName="archive-image object-contain object-center transition group-hover:scale-[1.01]"
                />
                <span className="text-center">
                  <span className="block text-xl font-semibold leading-none">{selectedGallerySign.restaurant_name || "Unknown Restaurant"}</span>
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
