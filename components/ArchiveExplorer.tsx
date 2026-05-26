"use client";

import { useMemo, useState } from "react";
import { SignGrid } from "@/components/SignGrid";
import { SignMap } from "@/components/SignMap";
import type { SignRecord } from "@/types/sign";

const BOROUGH_ORDER = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island", "Unknown"];

function boroughFor(sign: SignRecord) {
  return sign.borough || "Unknown";
}

export function ArchiveExplorer({ signs }: { signs: SignRecord[] }) {
  const [borough, setBorough] = useState("All");
  const boroughs = useMemo(() => {
    const available = new Set(signs.map(boroughFor));
    return ["All", ...BOROUGH_ORDER.filter((item) => available.has(item))];
  }, [signs]);

  const filteredSigns = useMemo(
    () => (borough === "All" ? signs : signs.filter((sign) => boroughFor(sign) === borough)),
    [borough, signs],
  );

  return (
    <>
      <nav className="grid gap-3 border-b border-black/10 px-3 py-3 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
        <div className="flex flex-wrap gap-1">
          {boroughs.map((item) => (
            <button
              key={item}
              type="button"
              className={`border px-2 py-1 font-mono text-[11px] uppercase ${
                item === borough ? "border-black bg-black text-[#fbf7ee]" : "border-black/15 bg-transparent text-black/60"
              }`}
              onClick={() => setBorough(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex gap-3 font-mono text-[11px] uppercase text-black/50">
          <span>{filteredSigns.length} visible</span>
          <a className="hover:text-black" href="#map">
            Map
          </a>
        </div>
      </nav>
      <SignGrid signs={filteredSigns} />
      <SignMap signs={filteredSigns} />
    </>
  );
}
