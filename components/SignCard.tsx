import type { SignRecord } from "@/types/sign";
import { OptimizedSignImage } from "@/components/OptimizedSignImage";

export function SignCard({ sign, onSelect, priority = false }: { sign: SignRecord; onSelect: () => void; priority?: boolean }) {
  const imageUrl = sign.image_processed_url || sign.image_original_url;
  const label = sign.restaurant_name || "Unknown Restaurant";
  const dateVisited = sign.date_visited || sign.date_collected;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="archive-card group block self-start text-center transition duration-200 focus:outline-none focus:ring-2 focus:ring-black"
    >
      <OptimizedSignImage
        src={imageUrl}
        alt={label}
        priority={priority}
        sizes="(min-width: 1280px) 15vw, (min-width: 1024px) 20vw, (min-width: 640px) 28vw, 42vw"
        className="mx-auto aspect-[4/5] max-h-[230px] w-full"
        imageClassName="archive-image object-contain object-center drop-shadow-sm transition duration-200 group-hover:scale-[1.04]"
      />
      <div className="pt-3 text-[12px] leading-tight opacity-0 transition duration-200 group-hover:opacity-100 group-focus:opacity-100">
        <p className="text-[13px] font-semibold leading-none text-black">{label}</p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-normal text-black/55">
          {[sign.borough, dateVisited].filter(Boolean).join(" / ") || "Date unknown"}
        </p>
      </div>
    </button>
  );
}
