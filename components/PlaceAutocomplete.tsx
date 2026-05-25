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

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: new (
            input: HTMLInputElement,
            options: Record<string, unknown>,
          ) => {
            addListener: (eventName: string, callback: () => void) => void;
            getPlace: () => {
              place_id?: string;
              name?: string;
              formatted_address?: string;
              url?: string;
              geometry?: {
                location?: {
                  lat?: () => number;
                  lng?: () => number;
                };
              };
            };
          };
        };
        LatLng: new (lat: number, lng: number) => unknown;
        LatLngBounds: new (southWest: unknown, northEast: unknown) => unknown;
      };
    };
  }
}

export function PlaceAutocomplete({
  apiKey,
  onPlaceSelected,
}: {
  apiKey?: string;
  onPlaceSelected: (place: PlaceValue) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState(apiKey ? "Search for a restaurant" : "Google Maps key missing");

  useEffect(() => {
    if (!apiKey || !inputRef.current) return;

    const existing = document.querySelector<HTMLScriptElement>("script[data-google-places]");
    const attach = () => {
      if (!window.google?.maps?.places || !inputRef.current) return;

      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        fields: ["place_id", "name", "formatted_address", "geometry", "url"],
        bounds: new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(40.4774, -74.2591),
          new window.google.maps.LatLng(40.9176, -73.7004),
        ),
        strictBounds: false,
        componentRestrictions: { country: "us" },
        types: ["establishment"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const lat = place.geometry?.location?.lat?.();
        const lng = place.geometry?.location?.lng?.();

        onPlaceSelected({
          place_id: place.place_id || "",
          restaurant_name: place.name || "",
          formatted_address: place.formatted_address || "",
          latitude: lat ? String(lat) : "",
          longitude: lng ? String(lng) : "",
          google_maps_url:
            place.url ||
            (place.place_id
              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  place.name || "",
                )}&query_place_id=${place.place_id}`
              : ""),
        });
        setStatus(place.name ? `Selected: ${place.name}` : "Place selected");
      });
    };

    if (existing) {
      existing.addEventListener("load", attach);
      attach();
      return () => existing.removeEventListener("load", attach);
    }

    const script = document.createElement("script");
    script.dataset.googlePlaces = "true";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.onerror = () => setStatus("Google Places failed to load");
    script.onload = attach;
    document.head.appendChild(script);
  }, [apiKey, onPlaceSelected]);

  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">Place search</span>
      <input
        ref={inputRef}
        className="border border-black/15 bg-white px-3 py-2 outline-none focus:border-black"
        placeholder="Search NYC restaurants"
        type="search"
      />
      <span className="font-mono text-[11px] uppercase text-black/45">{status}</span>
    </label>
  );
}
