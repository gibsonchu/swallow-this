import Link from "next/link";
import type { SignRecord } from "@/types/sign";

export function SignCard({ sign }: { sign: SignRecord }) {
  const imageUrl = sign.image_processed_url || sign.image_original_url;
  const label = sign.restaurant_name || "Unknown Restaurant";
  const dateVisited = sign.date_visited || sign.date_collected;

  return (
    <Link
      href={`/sign/${sign.id}`}
      className="archive-card group block text-center transition duration-200 focus:outline-none focus:ring-2 focus:ring-black"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={label}
        className="archive-image mx-auto aspect-[4/5] max-h-[230px] w-full object-contain object-center drop-shadow-sm transition duration-200 group-hover:scale-[1.04]"
      />
      <div className="pt-3 text-[12px] leading-tight opacity-0 transition duration-200 group-hover:opacity-100 group-focus:opacity-100">
        <p className="font-semibold text-black">{label}</p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-normal text-black/55">
          {[sign.borough, dateVisited].filter(Boolean).join(" / ") || "Date unknown"}
        </p>
      </div>
    </Link>
  );
}
