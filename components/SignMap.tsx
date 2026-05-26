"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { SignRecord } from "@/types/sign";
import type * as Leaflet from "leaflet";

function mappedSign(sign: SignRecord) {
  const lat = Number(sign.latitude);
  const lng = Number(sign.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { sign, lat, lng };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function SignMap({ signs }: { signs: SignRecord[] }) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mappedSigns = useMemo(() => signs.map(mappedSign).filter(Boolean) as { sign: SignRecord; lat: number; lng: number }[], [signs]);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return;

    let cancelled = false;

    void import("leaflet").then((leaflet) => {
      if (cancelled || !mapElementRef.current || mapRef.current) return;

      const map = leaflet.map(mapElementRef.current, {
        center: [40.7128, -74.006],
        zoom: 12,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
      });

      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      leafletRef.current = leaflet;
      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const leaflet = leafletRef.current;
    if (!mapReady || !map || !leaflet) return;

    map.eachLayer((layer) => {
      if (layer instanceof leaflet.Marker) map.removeLayer(layer);
    });

    const bounds: [number, number][] = [];

    mappedSigns.forEach(({ sign, lat, lng }) => {
      const imageUrl = sign.image_processed_url || sign.image_original_url;
      const restaurant = escapeHtml(sign.restaurant_name || "Unknown Restaurant");
      const address = escapeHtml(sign.formatted_address || "Address Pending");
      const restaurantHref = sign.restaurant_website_url || `/sign/${encodeURIComponent(sign.id)}`;
      const addressHref = sign.google_maps_url || `/sign/${encodeURIComponent(sign.id)}`;
      const icon = leaflet.divIcon({
        className: "",
        html: `
          <div class="grid h-[72px] w-[72px] place-items-center rounded-full border border-black bg-white shadow-sm">
            <img src="${escapeHtml(imageUrl)}" alt="" class="archive-image h-14 w-14 rounded-full object-cover object-center" />
          </div>
        `,
        iconSize: [72, 72],
        iconAnchor: [36, 36],
        popupAnchor: [0, -38],
      });

      leaflet.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(
          `
          <div class="w-56 text-sm leading-tight">
            <a class="block font-semibold underline-offset-2 hover:underline" href="${escapeHtml(restaurantHref)}" target="${sign.restaurant_website_url ? "_blank" : "_self"}">${restaurant}</a>
            <a class="mt-2 block text-xs leading-4 text-black/65 underline-offset-2 hover:underline" href="${escapeHtml(addressHref)}" target="_blank">${address}</a>
            <a class="mt-3 block font-mono text-[10px] uppercase text-black/45 hover:text-black" href="/sign/${escapeHtml(sign.id)}">View Sign</a>
          </div>
        `,
          { className: "sign-map-popup" },
        );
      bounds.push([lat, lng]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [70, 70], maxZoom: 15 });
    }
  }, [mapReady, mappedSigns]);

  return (
    <section className="h-full bg-[#fdfdf9]">
      <div className="grid h-full gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative min-h-[calc(100vh-82px)] border-b border-black/10 lg:border-b-0 lg:border-r">
          <div ref={mapElementRef} className="absolute inset-0" />
          {mappedSigns.length === 0 && (
            <div className="absolute inset-0 z-[500] grid place-items-center bg-[#fdfdf9]/80 p-6 text-center text-sm text-black/45">
              Saved Signs With Latitude And Longitude Will Appear Here.
            </div>
          )}
        </div>

        <div className="max-h-[calc(100vh-82px)] overflow-auto bg-[#fdfdf9]">
          <div className="sticky top-0 border-b border-black/10 bg-[#fdfdf9] p-4 font-mono text-[11px] uppercase text-black/50">
            {mappedSigns.length} Mapped Signs
          </div>
          <div className="divide-y divide-black/10">
            {mappedSigns.map(({ sign }, index) => (
              <Link key={sign.id} href={`/sign/${sign.id}`} className="grid grid-cols-[34px_1fr] gap-4 p-4 text-sm hover:bg-white">
                <span className="font-mono text-[11px] text-black/45">{String(index + 1).padStart(2, "0")}</span>
                <span>
                  <span className="block font-medium">{sign.restaurant_name || "Unknown Restaurant"}</span>
                  <span className="mt-1 block font-mono text-[11px] uppercase text-black/45">
                    {[sign.borough, sign.date_visited || sign.date_collected].filter(Boolean).join(" / ") ||
                      "Unlabeled"}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
