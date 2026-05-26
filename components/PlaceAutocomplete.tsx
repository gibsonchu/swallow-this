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

type GooglePrediction = {
  place_id?: string;
  description?: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
};

type GooglePlace = {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  url?: string;
  geometry?: {
    location?: {
      lat: () => number;
      lng: () => number;
    };
  };
};

type AutocompleteService = {
  getPlacePredictions: (
    request: {
      input: string;
      bounds?: unknown;
      componentRestrictions?: { country: string };
      types?: string[];
    },
    callback: (predictions: GooglePrediction[] | null, status: string) => void,
  ) => void;
};

type PlacesService = {
  getDetails: (
    request: { placeId: string; fields: string[] },
    callback: (place: GooglePlace | null, status: string) => void,
  ) => void;
};

declare global {
  interface Window {
    google?: {
      maps: {
        LatLng: new (lat: number, lng: number) => unknown;
        LatLngBounds: new (sw: unknown, ne: unknown) => unknown;
        places: {
          AutocompleteService: new () => AutocompleteService;
          PlacesService: new (element: HTMLDivElement) => PlacesService;
          PlacesServiceStatus: {
            OK: string;
            ZERO_RESULTS: string;
          };
        };
      };
    };
  }
}

let googleMapsPromise: Promise<void> | null = null;

function loadGoogleMaps(apiKey: string) {
  if (window.google?.maps?.places) return Promise.resolve();
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&v=weekly`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function nycBounds() {
  if (!window.google) return undefined;
  const sw = new window.google.maps.LatLng(40.4774, -74.2591);
  const ne = new window.google.maps.LatLng(40.9176, -73.7004);
  return new window.google.maps.LatLngBounds(sw, ne);
}

export function PlaceAutocomplete({
  apiKey,
  onPlaceSelected,
}: {
  apiKey?: string;
  onPlaceSelected: (place: PlaceValue) => void;
}) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [status, setStatus] = useState(apiKey ? "Search for a restaurant" : "Google Maps key missing");
  const [open, setOpen] = useState(false);
  const serviceRef = useRef<AutocompleteService | null>(null);
  const placesRef = useRef<PlacesService | null>(null);
  const detailsElementRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!apiKey || serviceRef.current) return;

    loadGoogleMaps(apiKey)
      .then(() => {
        if (!window.google?.maps?.places || !detailsElementRef.current) {
          throw new Error("Google Places library did not load");
        }

        serviceRef.current = new window.google.maps.places.AutocompleteService();
        placesRef.current = new window.google.maps.places.PlacesService(detailsElementRef.current);
        setStatus("Search for a restaurant");
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Google Maps failed to load");
      });
  }, [apiKey]);

  useEffect(() => {
    const input = query.trim();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!apiKey) {
      setStatus("Google Maps key missing");
      return;
    }

    if (input.length < 2) {
      setPredictions([]);
      setOpen(false);
      setStatus("Search for a restaurant");
      return;
    }

    const timer = window.setTimeout(() => {
      const service = serviceRef.current;
      if (!service || !window.google?.maps?.places) {
        setStatus("Loading Google Places");
        return;
      }

      setStatus("Searching");
      service.getPlacePredictions(
        {
          input,
          bounds: nycBounds(),
          componentRestrictions: { country: "us" },
          types: ["establishment"],
        },
        (googlePredictions, googleStatus) => {
          if (requestId !== requestIdRef.current) return;

          if (googleStatus === window.google?.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            setPredictions([]);
            setOpen(false);
            setStatus("No places found");
            return;
          }

          if (googleStatus !== window.google?.maps.places.PlacesServiceStatus.OK) {
            setPredictions([]);
            setOpen(false);
            setStatus(`Google Places error: ${googleStatus}`);
            return;
          }

          const nextPredictions = (googlePredictions || [])
            .map((prediction) => ({
              place_id: prediction.place_id || "",
              label: prediction.description || "",
              main_text: prediction.structured_formatting?.main_text || prediction.description || "",
              secondary_text: prediction.structured_formatting?.secondary_text || "",
            }))
            .filter((prediction) => prediction.place_id && prediction.label);

          setPredictions(nextPredictions);
          setOpen(nextPredictions.length > 0);
          setStatus(nextPredictions.length ? "Select a place" : "No places found");
        },
      );
    }, 250);

    return () => window.clearTimeout(timer);
  }, [apiKey, query]);

  const selectPrediction = (prediction: Prediction) => {
    const places = placesRef.current;
    setQuery(prediction.label);
    setOpen(false);

    if (!places || !window.google?.maps?.places) {
      onPlaceSelected({
        place_id: prediction.place_id,
        restaurant_name: prediction.main_text,
        formatted_address: prediction.secondary_text,
        latitude: "",
        longitude: "",
        google_maps_url: `https://www.google.com/maps/place/?q=place_id:${prediction.place_id}`,
      });
      setStatus(`Selected: ${prediction.main_text}`);
      return;
    }

    setStatus("Loading place");
    places.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["place_id", "name", "formatted_address", "geometry", "url"],
      },
      (place, googleStatus) => {
        if (googleStatus !== window.google?.maps.places.PlacesServiceStatus.OK || !place) {
          onPlaceSelected({
            place_id: prediction.place_id,
            restaurant_name: prediction.main_text,
            formatted_address: prediction.secondary_text,
            latitude: "",
            longitude: "",
            google_maps_url: `https://www.google.com/maps/place/?q=place_id:${prediction.place_id}`,
          });
          setStatus(`Selected: ${prediction.main_text}`);
          return;
        }

        onPlaceSelected({
          place_id: place.place_id || prediction.place_id,
          restaurant_name: place.name || prediction.main_text,
          formatted_address: place.formatted_address || prediction.secondary_text,
          latitude: place.geometry?.location ? String(place.geometry.location.lat()) : "",
          longitude: place.geometry?.location ? String(place.geometry.location.lng()) : "",
          google_maps_url: place.url || `https://www.google.com/maps/place/?q=place_id:${prediction.place_id}`,
        });
        setStatus(`Selected: ${place.name || prediction.main_text}`);
      },
    );
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
      <div ref={detailsElementRef} className="hidden" />
    </label>
  );
}
