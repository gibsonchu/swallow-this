"use client";

import Link from "next/link";
import type { SignRecord } from "@/types/sign";

const NYC_BOUNDS = {
  north: 40.9176,
  south: 40.4774,
  east: -73.7004,
  west: -74.2591,
};

function pinPosition(sign: SignRecord) {
  const lat = Number(sign.latitude);
  const lng = Number(sign.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const x = ((lng - NYC_BOUNDS.west) / (NYC_BOUNDS.east - NYC_BOUNDS.west)) * 100;
  const y = ((NYC_BOUNDS.north - lat) / (NYC_BOUNDS.north - NYC_BOUNDS.south)) * 100;

  if (x < 0 || x > 100 || y < 0 || y > 100) return null;
  return { x, y };
}

export function SignMap({ signs }: { signs: SignRecord[] }) {
  const mappedSigns = signs
    .map((sign) => ({ sign, position: pinPosition(sign) }))
    .filter((item): item is { sign: SignRecord; position: { x: number; y: number } } => Boolean(item.position));

  return (
    <section className="h-full bg-[#fdfdf9]">
      <div className="grid h-full gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="relative min-h-[calc(100vh-74px)] overflow-hidden border-b border-black/10 bg-[#f4f4ee] lg:border-b-0 lg:border-r">
          <div className="absolute inset-0 opacity-80">
            <div className="absolute left-[16%] top-[12%] h-[78%] w-[22%] rotate-[8deg] border border-black/15 bg-white/60" />
            <div className="absolute left-[39%] top-[30%] h-[42%] w-[18%] rotate-[-12deg] border border-black/15 bg-white/45" />
            <div className="absolute left-[55%] top-[18%] h-[60%] w-[26%] rotate-[5deg] border border-black/15 bg-white/45" />
            <div className="absolute left-[28%] top-[72%] h-[18%] w-[28%] rotate-[-5deg] border border-black/10 bg-white/35" />
          </div>
          <div className="absolute left-3 top-3 z-10 font-mono text-[11px] uppercase text-black/50">
            Approximate NYC map
          </div>
          {mappedSigns.map(({ sign, position }, index) => (
            <Link
              key={sign.id}
              href={`/sign/${sign.id}`}
              className="group absolute z-20 -translate-x-1/2 -translate-y-1/2 hover:z-30"
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
              title={sign.restaurant_name || `Sign ${index + 1}`}
            >
              <span className="grid h-16 w-16 place-items-center rounded-full border border-black bg-white shadow-sm transition group-hover:scale-125">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sign.image_processed_url || sign.image_original_url}
                  alt=""
                  className="h-12 w-12 rounded-full object-contain"
                />
              </span>
              <span className="pointer-events-none absolute left-1/2 top-20 hidden w-44 -translate-x-1/2 border border-black bg-white p-2 text-left text-[11px] font-normal leading-tight text-black shadow-sm group-hover:block">
                <span className="block font-medium">{sign.restaurant_name || "Unknown restaurant"}</span>
                <span className="mt-1 block font-mono uppercase text-black/55">
                  {sign.borough || "Borough unknown"}
                </span>
              </span>
            </Link>
          ))}
          {mappedSigns.length === 0 && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-black/45">
              Saved signs with latitude and longitude will appear here.
            </div>
          )}
        </div>

        <div className="max-h-[calc(100vh-74px)] overflow-auto bg-[#fdfdf9]">
          <div className="sticky top-0 border-b border-black/10 bg-[#fdfdf9] p-3 font-mono text-[11px] uppercase text-black/50">
            {mappedSigns.length} mapped signs
          </div>
          <div className="divide-y divide-black/10">
            {mappedSigns.map(({ sign }, index) => (
              <Link key={sign.id} href={`/sign/${sign.id}`} className="grid grid-cols-[32px_1fr] gap-3 p-3 text-sm hover:bg-white">
                <span className="font-mono text-[11px] text-black/45">{String(index + 1).padStart(2, "0")}</span>
                <span>
                  <span className="block font-medium">{sign.restaurant_name || "Unknown restaurant"}</span>
                  <span className="mt-1 block font-mono text-[11px] uppercase text-black/45">
                    {[sign.borough, sign.date_visited || sign.date_collected].filter(Boolean).join(" / ") ||
                      "Unlabeled"}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
