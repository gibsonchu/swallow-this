import Link from "next/link";
import type { SignRecord } from "@/types/sign";

export function SignCard({ sign }: { sign: SignRecord }) {
  const imageUrl = sign.image_processed_url || sign.image_original_url;

  return (
    <Link
      href={`/sign/${sign.id}`}
      className="group relative block overflow-hidden border border-black/10 bg-[#f8f4ea] focus:outline-none focus:ring-2 focus:ring-black"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={sign.sign_title}
        className="aspect-[4/5] w-full object-contain p-2 transition duration-150 group-hover:scale-[1.02]"
      />
      <div className="absolute inset-x-0 bottom-0 translate-y-1 bg-[#fbf7ee]/95 p-2 text-[11px] leading-tight opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100 group-focus:translate-y-0 group-focus:opacity-100 sm:text-xs">
        <p className="font-medium text-black">{sign.sign_title}</p>
        <p className="mt-1 text-black/70">{sign.restaurant_name}</p>
        <p className="font-mono text-[10px] uppercase tracking-normal text-black/55">
          {sign.neighborhood}, {sign.borough}
        </p>
      </div>
    </Link>
  );
}
