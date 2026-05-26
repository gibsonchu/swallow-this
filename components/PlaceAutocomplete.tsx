"use client";

import { useEffect, useRef, useState } from "react";

type PlaceValue = {
  place_id: string;
  restaurant_name: string;
  formatted_address: string;
  latitude: string;
  longitude: string;
  google_maps_url: string;
};

type Prediction = {
  place_id: string;
  label: string;
  main_text: string;
  secondary_text: string;
};

export function PlaceAutocomplete({
  onPlaceSelected,
}: {
  apiKey?: string;
  onPlaceSelected: (place: PlaceValue) => void;
}) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [status, setStatus] = useState("Search for a restaurant");
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();

    const input = query.trim();
    if (input.length < 2) {
      setPredictions([]);
      setOpen(false);
      setStatus("Search for a restaurant");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const timer = window.setTimeout(async () => {
      try {
        setStatus("Searching");
        const response = await fetch("/api/places/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input }),
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Place search failed");

        setPredictions(result.predictions || []);
        setOpen(Boolean(result.predictions?.length));
        setStatus(result.predictions?.length ? "Select a place" : "No places found");
      } catch (error) {
        if (controller.signal.aborted) return;
        setPredictions([]);
        setOpen(false);
        setStatus(error instanceof Error ? error.message : "Place search failed");
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const selectPrediction = async (prediction: Prediction) => {
    setQuery(prediction.label);
    setOpen(false);
    setStatus("Loading place");

    try {
      const response = await fetch("/api/places/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place_id: prediction.place_id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Place details failed");

      onPlaceSelected(result.place);
      setStatus(result.place.restaurant_name ? `Selected: ${result.place.restaurant_name}` : "Place selected");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Place details failed");
    }
  };

  return (
    <label className="relative grid gap-1 text-sm">
      <span className="font-medium">Place search</span>
      <input
        className="border border-black/15 bg-white px-3 py-2 outline-none focus:border-black"
        placeholder="Search NYC restaurants"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => predictions.length > 0 && setOpen(true)}
      />
      {open && predictions.length > 0 && (
        <div className="absolute left-0 right-0 top-[64px] z-30 border border-black bg-white shadow-sm">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              className="block w-full border-b border-black/10 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-black hover:text-white"
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectPrediction(prediction)}
            >
              <span className="block font-medium">{prediction.main_text}</span>
              {prediction.secondary_text && (
                <span className="block text-xs opacity-65">{prediction.secondary_text}</span>
              )}
            </button>
          ))}
          <div className="px-3 py-1.5 font-mono text-[10px] uppercase text-black/40">Powered by Google</div>
        </div>
      )}
      <span className="font-mono text-[11px] uppercase text-black/45">{status}</span>
    </label>
  );
}
