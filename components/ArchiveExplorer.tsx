"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SignGrid } from "@/components/SignGrid";
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
    <div className="min-h-screen bg-[#fdfdf9] text-[#151515] md:grid md:grid-cols-[260px_1fr]">
      <aside className="border-b border-black/10 p-5 md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r md:p-7">
        <h1 className="max-w-[10rem] text-2xl font-semibold leading-[0.95] tracking-normal md:text-3xl">
          Choking Hazard Signs
        </h1>
        <p className="mt-4 max-w-[13rem] text-sm leading-5 text-black/55">
          An archive of choking hazard signs around New York City.
        </p>

        <nav className="mt-8 grid gap-8">
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
            <Link className="text-lg font-semibold text-black/45 hover:text-black" href="/map">
              Map
            </Link>
          </div>

          <p className="font-mono text-[11px] uppercase text-black/45">{filteredSigns.length} signs</p>
        </nav>
      </aside>
      <section className="px-4 py-6 md:px-8 md:py-10">
        <SignGrid signs={filteredSigns} />
      </section>
    </div>
  );
}
