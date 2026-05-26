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

type GoogleAutocomplete = {
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

type GooglePlace = {
  id?: string;
  displayName?: string;
  formattedAddress?: string;
  googleMapsURI?: string;
  location?: {
    lat?: () => number;
    lng?: () => number;
  };
  fetchFields?: (request: { fields: string[] }) => Promise<void>;
};

type PlacePrediction = {
  toPlace: () => GooglePlace;
};

type PlaceAutocompleteSelectEvent = Event & {
  placePrediction?: PlacePrediction;
};

type PlaceAutocompleteElement = HTMLElement & {
  includedRegionCodes?: string[];
  locationBias?: unknown;
  placeholder?: string;
};

declare global {
  interface Window {
    __swallowThisInitPlaces?: () => void;
    google?: {
      maps?: {
        places?: {
          Autocomplete: new (
            input: HTMLInputElement,
            options: Record<string, unknown>,
          ) => GoogleAutocomplete;
          PlaceAutocompleteElement?: new (
            options?: Record<string, unknown>,
          ) => PlaceAutocompleteElement;
        };
        importLibrary?: (libraryName: string) => Promise<unknown>;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState(apiKey ? "Search for a restaurant" : "Google Maps key missing");

  useEffect(() => {
    if (!apiKey || !containerRef.current) return;

    const existing = document.querySelector<HTMLScriptElement>("script[data-google-places]");
    let cancelled = false;
    let autocomplete: GoogleAutocomplete | null = null;
    let placeElement: PlaceAutocompleteElement | null = null;
    const nycBounds = () =>
      new window.google!.maps!.LatLngBounds(
        new window.google!.maps!.LatLng(40.4774, -74.2591),
        new window.google!.maps!.LatLng(40.9176, -73.7004),
      );

    const selectPlace = async (place: GooglePlace) => {
      await place.fetchFields?.({
        fields: ["id", "displayName", "formattedAddress", "location", "googleMapsURI"],
      });

      const lat = place.location?.lat?.();
      const lng = place.location?.lng?.();
      const name = place.displayName || "";

      onPlaceSelected({
        place_id: place.id || "",
        restaurant_name: name,
        formatted_address: place.formattedAddress || "",
        latitude: lat ? String(lat) : "",
        longitude: lng ? String(lng) : "",
        google_maps_url:
          place.googleMapsURI ||
          (place.id
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${
                place.id
              }`
            : ""),
      });
      setStatus(name ? `Selected: ${name}` : "Place selected");
    };

    const attachNewAutocomplete = async () => {
      if (!window.google?.maps?.importLibrary || !containerRef.current || placeElement) return false;

      await window.google.maps.importLibrary("places");
      if (cancelled || !window.google.maps.places?.PlaceAutocompleteElement || !containerRef.current) {
        return false;
      }

      placeElement = new window.google.maps.places.PlaceAutocompleteElement();
      placeElement.includedRegionCodes = ["us"];
      placeElement.locationBias = nycBounds();
      placeElement.placeholder = "Search NYC restaurants";
      placeElement.className = "w-full";
      placeElement.addEventListener("gmp-select", async (event) => {
        const placePrediction = (event as PlaceAutocompleteSelectEvent).placePrediction;
        if (!placePrediction) return;
        try {
          setStatus("Loading place");
          await selectPlace(placePrediction.toPlace());
        } catch {
          setStatus("Place details failed to load");
        }
      });

      containerRef.current.replaceChildren(placeElement);
      setStatus("Search for a restaurant");
      return true;
    };

    const attachLegacyAutocomplete = () => {
      const input = document.createElement("input");
      input.className = "w-full border border-black/15 bg-white px-3 py-2 outline-none focus:border-black";
      input.placeholder = "Search NYC restaurants";
      input.type = "search";
      containerRef.current?.replaceChildren(input);

      if (!window.google?.maps?.places || !input) return;
      if (autocomplete) return;

      autocomplete = new window.google.maps.places.Autocomplete(input, {
        fields: ["place_id", "name", "formatted_address", "geometry", "url"],
        bounds: nycBounds(),
        strictBounds: false,
        componentRestrictions: { country: "us" },
        types: ["establishment"],
      });

      const nextAutocomplete = autocomplete;
      nextAutocomplete.addListener("place_changed", () => {
        const place = nextAutocomplete.getPlace();
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

    const attach = async () => {
      if (await attachNewAutocomplete()) return;
      attachLegacyAutocomplete();
    };

    if (existing) {
      existing.addEventListener("load", attach);
      void attach();
      return () => existing.removeEventListener("load", attach);
    }

    window.__swallowThisInitPlaces = attach;
    const script = document.createElement("script");
    script.dataset.googlePlaces = "true";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&loading=async&libraries=places&callback=__swallowThisInitPlaces`;
    script.async = true;
    script.defer = true;
    script.onerror = () => setStatus("Google Places failed to load");
    document.head.appendChild(script);

    return () => {
      if (window.__swallowThisInitPlaces === attach) {
        delete window.__swallowThisInitPlaces;
      }
      cancelled = true;
    };
  }, [apiKey, onPlaceSelected]);

  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">Place search</span>
      <div
        ref={containerRef}
        className="[&_*]:font-sans [&_input]:border [&_input]:border-black/15 [&_input]:bg-white [&_input]:px-3 [&_input]:py-2"
      />
      <span className="font-mono text-[11px] uppercase text-black/45">{status}</span>
    </label>
  );
}
