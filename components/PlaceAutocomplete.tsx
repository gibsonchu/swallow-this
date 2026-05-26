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

type GooglePlace = {
  id?: string;
  displayName?: string | { text?: string };
  formattedAddress?: string;
  googleMapsURI?: string;
  googleMapsUri?: string;
  location?: {
    lat?: () => number;
    lng?: () => number;
    latitude?: number;
    longitude?: number;
  };
  fetchFields: (request: { fields: string[] }) => Promise<void>;
};

type PlacePrediction = {
  text?: { text?: string };
  toPlace: () => GooglePlace;
};

type PlaceAutocompleteElement = HTMLElement & {
  placeholder?: string;
  includedRegionCodes?: string[];
  locationBias?: { radius: number; center: { lat: number; lng: number } };
};

type PlacesLibrary = {
  PlaceAutocompleteElement: new () => PlaceAutocompleteElement;
};

declare global {
  interface Window {
    google?: {
      maps: {
        importLibrary?: (library: "places") => Promise<PlacesLibrary>;
      };
    };
  }
}

let googleMapsPromise: Promise<void> | null = null;

function loadGoogleMaps(apiKey: string) {
  if (window.google?.maps?.importLibrary) return Promise.resolve();
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-google-maps-places]");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Maps failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsPlaces = "true";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function displayNameFor(place: GooglePlace, prediction?: PlacePrediction) {
  if (typeof place.displayName === "string") return place.displayName;
  return place.displayName?.text || prediction?.text?.text || "";
}

function coordinateValue(value: (() => number) | number | undefined) {
  return typeof value === "function" ? value() : value;
}

export function PlaceAutocomplete({
  apiKey,
  onPlaceSelected,
}: {
  apiKey?: string;
  onPlaceSelected: (place: PlaceValue) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<PlaceAutocompleteElement | null>(null);
  const [status, setStatus] = useState(apiKey ? "Search for a restaurant" : "Google Maps key missing");

  useEffect(() => {
    if (!apiKey || autocompleteRef.current) return;

    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    loadGoogleMaps(apiKey)
      .then(async () => {
        if (!window.google?.maps.importLibrary) {
          throw new Error("Google Maps importLibrary did not load");
        }

        const { PlaceAutocompleteElement } = await window.google.maps.importLibrary("places");
        if (cancelled || !container) return;

        const autocomplete = new PlaceAutocompleteElement();
        autocomplete.placeholder = "Search NYC restaurants";
        autocomplete.includedRegionCodes = ["us"];
        autocomplete.locationBias = { radius: 25000, center: { lat: 40.7128, lng: -74.006 } };
        autocomplete.className = "block w-full";

        autocomplete.addEventListener("gmp-select", async (event) => {
          const prediction = (event as Event & { placePrediction?: PlacePrediction }).placePrediction;
          if (!prediction) {
            setStatus("Place selection failed");
            return;
          }

          setStatus("Loading place");
          try {
            const place = prediction.toPlace();
            await place.fetchFields({
              fields: ["id", "displayName", "formattedAddress", "location", "googleMapsURI"],
            });

            const lat = coordinateValue(place.location?.lat) ?? place.location?.latitude;
            const lng = coordinateValue(place.location?.lng) ?? place.location?.longitude;
            const placeId = place.id || "";
            const restaurantName = displayNameFor(place, prediction);

            onPlaceSelected({
              place_id: placeId,
              restaurant_name: restaurantName,
              formatted_address: place.formattedAddress || "",
              latitude: lat === undefined ? "" : String(lat),
              longitude: lng === undefined ? "" : String(lng),
              google_maps_url:
                place.googleMapsURI ||
                place.googleMapsUri ||
                (placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : ""),
            });
            setStatus(restaurantName ? `Selected: ${restaurantName}` : "Place selected");
          } catch (error) {
            setStatus(error instanceof Error ? error.message : "Place details failed");
          }
        });

        container.replaceChildren(autocomplete);
        autocompleteRef.current = autocomplete;
        setStatus("Search for a restaurant");
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Google Maps failed to load");
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, onPlaceSelected]);

  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">Place search</span>
      <div className="min-h-10 border border-black/15 bg-white px-2 py-1" ref={containerRef} />
      <span className="font-mono text-[11px] uppercase text-black/45">{status}</span>
    </label>
  );
}
