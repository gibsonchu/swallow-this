"use client";

import { useEffect } from "react";
import type { SignRecord } from "@/types/sign";

function imageFor(sign: SignRecord) {
  return sign.image_processed_url || sign.image_original_url;
}

function dateFor(sign: SignRecord) {
  return sign.date_visited || sign.date_collected;
}

export function SignModal({
  sign,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  sign: SignRecord;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const hasDesigner = Boolean(sign.designer);
  const metadata: [string, string][] = [
    ["Address", sign.formatted_address],
    ["Designer", sign.designer || "Unknown"],
    ["Borough", sign.borough],
    ["Date Visited", dateFor(sign)],
    ["Submitted By", sign.submitter_name],
    ...(sign.restaurants_using_design
      ? ([["List Of Restaurants Also Using This Design", sign.restaurants_using_design]] as [string, string][])
      : []),
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onPrev();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onNext();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNext, onPrev]);

  return (
    <div className="fixed inset-0 z-[1000] bg-[#fdfdf9]/70 backdrop-blur-md" role="dialog" aria-modal="true">
      <button className="absolute inset-0 cursor-default" type="button" aria-label="Close" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 grid max-h-[92vh] min-h-[min(720px,88vh)] w-[min(980px,94vw)] -translate-x-1/2 -translate-y-1/2 gap-5 overflow-auto border border-black/10 bg-[#fdfdf9] p-4 pt-12 shadow-sm sm:p-5 sm:pt-12 md:grid-cols-[minmax(0,1fr)_330px] md:pt-5">
        <button className="absolute right-4 top-4 px-2 py-1 font-mono text-[11px] uppercase text-black/45 hover:text-black" type="button" onClick={onClose}>
          Close
        </button>
        <div className="grid min-h-[260px] place-items-center bg-white sm:min-h-[340px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageFor(sign)} alt={sign.restaurant_name || "Choking hazard sign"} className="archive-image max-h-[72vh] w-full object-contain object-center p-3" />
        </div>
        <div className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase text-black/45 md:hidden">
          <button type="button" className="px-2 py-2 hover:text-black" onClick={onPrev}>
            ← Prev
          </button>
          <span>
            {index + 1} / {total}
          </span>
          <button type="button" className="px-2 py-2 hover:text-black" onClick={onNext}>
            Next →
          </button>
        </div>
        <section className="flex min-h-[460px] flex-col gap-4 md:min-h-[520px] md:pr-0">
          <div>
            <p className="font-mono text-[11px] uppercase text-black/45">
              {index + 1} / {total}
            </p>
            <h2 className="display-title mt-2 text-2xl leading-[0.95]">{sign.restaurant_name || "Unknown Restaurant"}</h2>
          </div>
          <dl className="grid gap-px overflow-hidden border border-black/10 text-sm">
            {metadata.map(([label, value]) => (
              <div key={label} className="grid bg-white sm:grid-cols-[118px_1fr]">
                <dt className="border-b border-black/10 p-2 font-mono text-[10px] uppercase text-black/45 sm:border-b-0 sm:border-r">{label}</dt>
                <dd className="whitespace-pre-line p-2">
                  {label === "Address" && sign.google_maps_url && value ? (
                    <a className="underline decoration-black/30 underline-offset-2 hover:decoration-black" href={sign.google_maps_url} target="_blank" rel="noreferrer">
                      {value}
                    </a>
                  ) : label === "Designer" && hasDesigner && sign.designer_url ? (
                    <a className="underline decoration-black/30 underline-offset-2 hover:decoration-black" href={sign.designer_url} target="_blank" rel="noreferrer">
                      {value}
                    </a>
                  ) : label === "Designer" && !hasDesigner ? (
                    <>
                      Unknown.{" "}
                      <a className="italic underline decoration-black/30 underline-offset-2 hover:decoration-black" href="https://x.com/gibsontchu" target="_blank" rel="noreferrer">
                        Please contact me to provide credit.
                      </a>
                    </>
                  ) : (
                    value || "Unknown"
                  )}
                </dd>
              </div>
            ))}
          </dl>
          {sign.notes && (
            <section>
              <h3 className="mb-2 font-mono text-[11px] uppercase text-black/45">Notes</h3>
              <p className="text-sm leading-6 text-black/75">{sign.notes}</p>
            </section>
          )}
          <div className="mt-auto hidden items-center justify-between gap-3 border-t border-black/10 pt-4 font-mono text-[11px] uppercase text-black/45 md:flex">
            <button type="button" className="hover:text-black" onClick={onPrev}>
              ← Prev
            </button>
            <span>
              {index + 1} / {total}
            </span>
            <button type="button" className="hover:text-black" onClick={onNext}>
              Next →
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
