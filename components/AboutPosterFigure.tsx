"use client";

import { useEffect, useState } from "react";

const caption =
  "The current city-issued choking first aid poster, redesigned in 2010 by graphics editors at The New York Times for the NYC Department of Health.";

export function AboutPosterFigure() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <figure className="my-10 max-w-sm">
        <button
          type="button"
          className="block w-full cursor-zoom-in text-left"
          onClick={() => setOpen(true)}
          aria-label="Open current city-issued choking first aid poster"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/about/current-city-poster.png"
            alt="Current city-issued choking first aid poster"
            className="w-full object-contain"
          />
        </button>
        <figcaption className="mt-3 font-mono text-[11px] uppercase leading-5 text-black/45">
          {caption}
        </figcaption>
      </figure>

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-white/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Current city-issued choking first aid poster"
          onClick={() => setOpen(false)}
        >
          <div className="relative max-h-[92vh] w-full max-w-4xl border border-black/10 bg-[#fdfdf9] p-4 shadow-sm" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="absolute right-3 top-3 z-10 bg-[#fdfdf9] px-3 py-2 font-mono text-[12px] uppercase text-black/55 hover:text-black"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/about/current-city-poster.png"
              alt="Current city-issued choking first aid poster"
              className="mx-auto max-h-[84vh] w-full object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
