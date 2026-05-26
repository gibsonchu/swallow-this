"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SignModal } from "@/components/SignModal";
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

function sortValue(sign: SignRecord) {
  const value = Number(sign.sort_order);
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

export function SignMap({ signs }: { signs: SignRecord[] }) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const markerRefs = useRef<Record<string, Leaflet.Marker>>({});
  const sidebarItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [mapReady, setMapReady] = useState(false);
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [selectedSignId, setSelectedSignId] = useState<string | null>(null);
  const mappedSigns = useMemo(
    () =>
      [...signs]
        .sort((a, b) => sortValue(a) - sortValue(b) || (a.restaurant_name || "").localeCompare(b.restaurant_name || ""))
        .map(mappedSign)
        .filter(Boolean) as { sign: SignRecord; lat: number; lng: number }[],
    [signs],
  );

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

      leaflet.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
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
    markerRefs.current = {};

    const bounds: [number, number][] = [];

    mappedSigns.forEach(({ sign, lat, lng }, position) => {
      const imageUrl = sign.image_processed_url || sign.image_original_url;
      const restaurant = escapeHtml(sign.restaurant_name || "Unknown Restaurant");
      const addressHtml = sign.formatted_address
        ? `<a class="mt-2 block text-xs leading-4 text-black/65 underline-offset-2 hover:underline" href="${escapeHtml(sign.google_maps_url || `/sign/${encodeURIComponent(sign.id)}`)}" target="_blank">${escapeHtml(sign.formatted_address)}</a>`
        : "";
      const index = mappedSigns.findIndex((item) => item.sign.id === sign.id);
      const icon = leaflet.divIcon({
        className: "",
        html: `
          <div class="grid h-9 w-9 place-items-center rounded-full border border-black bg-[#fdfdf9] font-mono text-[12px] text-black shadow-sm">
            ${position + 1}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -22],
      });

      const marker = leaflet.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(
          `
          <div class="w-60 text-sm leading-tight">
            <img src="${escapeHtml(imageUrl)}" alt="" class="archive-image mb-3 h-28 w-full bg-white object-contain object-center" />
            <span class="block font-semibold">${restaurant}</span>
            ${addressHtml}
            <button class="mt-3 block font-mono text-[10px] uppercase text-black/45 hover:text-black" type="button" data-sign-modal-index="${index}">View Sign</button>
          </div>
        `,
          { autoPan: false, className: "sign-map-popup" },
        );
      marker.on("click", () => {
        setSelectedSignId(sign.id);
        map.setView(marker.getLatLng(), Math.max(map.getZoom(), 15), { animate: true });
      });
      markerRefs.current[sign.id] = marker;
      bounds.push([lat, lng]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [70, 70], maxZoom: 15 });
    }
  }, [mapReady, mappedSigns]);

  useEffect(() => {
    if (!selectedSignId) return;
    sidebarItemRefs.current[selectedSignId]?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [selectedSignId]);

  useEffect(() => {
    const element = mapElementRef.current;
    if (!element) return;

    const openModalFromPopup = (event: MouseEvent) => {
      const target = event.target instanceof HTMLElement ? event.target.closest("[data-sign-modal-index]") : null;
      if (!(target instanceof HTMLElement)) return;
      const index = Number(target.dataset.signModalIndex);
      if (Number.isFinite(index)) setModalIndex(index);
    };

    element.addEventListener("click", openModalFromPopup);
    return () => element.removeEventListener("click", openModalFromPopup);
  }, []);

  const focusSign = (sign: SignRecord) => {
    const map = mapRef.current;
    const marker = markerRefs.current[sign.id];
    if (!map || !marker) return;
    setSelectedSignId(sign.id);
    const targetZoom = Math.max(map.getZoom(), 15);
    map.setView(marker.getLatLng(), targetZoom, { animate: true });
    window.setTimeout(() => {
      map.setView(marker.getLatLng(), targetZoom, { animate: false });
      marker.openPopup();
    }, 260);
  };

  const prevIndex = (index: number) => (index - 1 + mappedSigns.length) % mappedSigns.length;
  const nextIndex = (index: number) => (index + 1) % mappedSigns.length;
  const activeModalSign = modalIndex === null ? null : mappedSigns[modalIndex]?.sign;

  return (
    <section className="h-full bg-[#fdfdf9]">
      <div className="grid h-full gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative min-h-[60vh] border-b border-black/10 lg:min-h-[calc(100vh-82px)] lg:border-b-0 lg:border-r">
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
              <button
                key={sign.id}
                ref={(element) => {
                  sidebarItemRefs.current[sign.id] = element;
                }}
                type="button"
                onClick={() => focusSign(sign)}
                className={`grid w-full grid-cols-[34px_1fr] gap-4 p-4 text-left text-sm ${selectedSignId === sign.id ? "bg-white" : "hover:bg-white"}`}
              >
                <span className={`font-mono text-[11px] ${selectedSignId === sign.id ? "text-black" : "text-black/45"}`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="block font-medium">{sign.restaurant_name || "Unknown Restaurant"}</span>
                  <span className="mt-1 block font-mono text-[11px] uppercase text-black/45">
                    {[sign.borough, sign.date_visited || sign.date_collected].filter(Boolean).join(" / ") ||
                      "Unlabeled"}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      {activeModalSign && (
        <SignModal
          sign={activeModalSign}
          index={modalIndex ?? 0}
          total={mappedSigns.length}
          onClose={() => setModalIndex(null)}
          onPrev={() => setModalIndex((index) => (index === null ? null : prevIndex(index)))}
          onNext={() => setModalIndex((index) => (index === null ? null : nextIndex(index)))}
        />
      )}
    </section>
  );
}
