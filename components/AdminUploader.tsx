"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PlaceAutocomplete } from "@/components/PlaceAutocomplete";
import type { SignRecord } from "@/types/sign";

type UploadState = {
  originalUrl: string;
  processedUrl: string;
  warning?: string;
};

type SignForm = {
  id?: string;
  restaurant_name: string;
  designer: string;
  place_id: string;
  formatted_address: string;
  latitude: string;
  longitude: string;
  google_maps_url: string;
  borough: string;
  neighborhood: string;
  notes: string;
  tags: string;
  date_collected: string;
  date_visited: string;
  published: boolean;
};

const today = new Date().toISOString().slice(0, 10);
const initialForm: SignForm = {
  restaurant_name: "",
  designer: "",
  place_id: "",
  formatted_address: "",
  latitude: "",
  longitude: "",
  google_maps_url: "",
  borough: "",
  neighborhood: "",
  notes: "",
  tags: "",
  date_collected: today,
  date_visited: today,
  published: false,
};

function formFromSign(sign: SignRecord): SignForm {
  return {
    id: sign.id,
    restaurant_name: sign.restaurant_name || "",
    designer: sign.designer || "",
    place_id: sign.place_id || "",
    formatted_address: sign.formatted_address || "",
    latitude: sign.latitude || "",
    longitude: sign.longitude || "",
    google_maps_url: sign.google_maps_url || "",
    borough: sign.borough || "",
    neighborhood: sign.neighborhood || "",
    notes: sign.notes || "",
    tags: sign.tags || "",
    date_collected: sign.date_collected || sign.date_visited || today,
    date_visited: sign.date_visited || sign.date_collected || today,
    published: Boolean(sign.published),
  };
}

export function AdminUploader({ googleMapsApiKey }: { googleMapsApiKey?: string }) {
  const [form, setForm] = useState<SignForm>(initialForm);
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [signs, setSigns] = useState<SignRecord[]>([]);

  const imageToShow = upload?.processedUrl || upload?.originalUrl;
  const editing = Boolean(form.id);
  const disabled = useMemo(() => Boolean(busy), [busy]);

  const loadSigns = useCallback(async () => {
    const response = await fetch("/api/signs?all=1");
    const result = await response.json();
    setSigns(result.signs || []);
  }, []);

  useEffect(() => {
    void loadSigns();
  }, [loadSigns]);

  const setField = (field: keyof SignForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm({ ...initialForm, date_collected: today, date_visited: today });
    setUpload(null);
    setMessage("");
  };

  const handlePlaceSelected = useCallback((place: {
    place_id: string;
    restaurant_name: string;
    formatted_address: string;
    latitude: string;
    longitude: string;
    google_maps_url: string;
  }) => {
    setForm((current) => ({ ...current, ...place }));
  }, []);

  const uploadFile = async (nextFile: File) => {
    setBusy("Uploading");
    setMessage("");
    const data = new FormData();
    data.append("file", nextFile);

    const response = await fetch("/api/upload", { method: "POST", body: data });
    const result = await response.json();
    setBusy("");
    if (!response.ok) throw new Error(result.error || "Upload failed");
    setUpload({ originalUrl: result.url, processedUrl: "", warning: result.warning });
    return result.url as string;
  };

  const handleSingleFile = async (nextFile: File | undefined) => {
    if (!nextFile) return;
    try {
      await uploadFile(nextFile);
    } catch (error) {
      setBusy("");
      setMessage(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const saveSign = async () => {
    const originalUrl = upload?.originalUrl || signs.find((sign) => sign.id === form.id)?.image_original_url;
    const processedUrl = upload?.processedUrl || upload?.originalUrl || signs.find((sign) => sign.id === form.id)?.image_processed_url;

    if (!originalUrl) {
      setMessage("Upload an image before saving.");
      return;
    }

    setBusy(editing ? "Updating" : "Saving");
    const response = await fetch("/api/signs", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        date_collected: form.date_visited,
        image_original_url: originalUrl,
        image_processed_url: processedUrl || originalUrl,
      }),
    });
    const result = await response.json();
    setBusy("");

    if (!response.ok) {
      setMessage(result.error || "Save failed");
      return;
    }

    setMessage(result.warning || `${editing ? "Updated" : "Saved"} in Google Sheets.`);
    resetForm();
    await loadSigns();
  };

  const editSign = (sign: SignRecord) => {
    setForm(formFromSign(sign));
    setUpload({ originalUrl: sign.image_original_url, processedUrl: sign.image_processed_url });
    setMessage("");
  };

  const deleteCurrentSign = async () => {
    if (!form.id) return;
    setBusy("Deleting");
    const response = await fetch(`/api/signs?id=${encodeURIComponent(form.id)}`, { method: "DELETE" });
    const result = await response.json();
    setBusy("");

    if (!response.ok) {
      setMessage(result.error || "Delete failed");
      return;
    }

    resetForm();
    setMessage("Removed from Google Sheets.");
    await loadSigns();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)_360px]">
      <section className="grid content-start gap-4">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Image</span>
          <input
            className="border border-black/15 bg-white p-2"
            type="file"
            accept="image/*"
            onChange={(event) => handleSingleFile(event.target.files?.[0])}
          />
        </label>

        <div className="aspect-[4/5] border border-black/10 bg-white">
          {imageToShow ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageToShow} alt="Upload preview" className="h-full w-full object-contain p-3" />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-black/40">
              Image preview
            </div>
          )}
        </div>
      </section>

      <section className="grid content-start gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{editing ? "Edit sign" : "New sign"}</h2>
          {editing && (
            <button className="border border-black/15 px-3 py-1 text-sm hover:border-black" type="button" onClick={resetForm}>
              New
            </button>
          )}
        </div>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Restaurant name</span>
          <input className="border border-black/15 bg-white px-3 py-2" value={form.restaurant_name} onChange={(event) => setField("restaurant_name", event.target.value)} />
        </label>

        <PlaceAutocomplete apiKey={googleMapsApiKey} onPlaceSelected={handlePlaceSelected} />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Latitude</span>
            <input className="border border-black/15 bg-white px-3 py-2" inputMode="decimal" value={form.latitude} onChange={(event) => setField("latitude", event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Longitude</span>
            <input className="border border-black/15 bg-white px-3 py-2" inputMode="decimal" value={form.longitude} onChange={(event) => setField("longitude", event.target.value)} />
          </label>
        </div>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Google Maps URL</span>
          <input className="border border-black/15 bg-white px-3 py-2" value={form.google_maps_url} onChange={(event) => setField("google_maps_url", event.target.value)} />
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Designer</span>
            <input className="border border-black/15 bg-white px-3 py-2" value={form.designer} onChange={(event) => setField("designer", event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Borough</span>
            <select className="border border-black/15 bg-white px-3 py-2" value={form.borough} onChange={(event) => setField("borough", event.target.value)}>
              <option value="">Unknown</option>
              <option value="Manhattan">Manhattan</option>
              <option value="Brooklyn">Brooklyn</option>
              <option value="Queens">Queens</option>
              <option value="Bronx">Bronx</option>
              <option value="Staten Island">Staten Island</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Date visited</span>
            <input className="border border-black/15 bg-white px-3 py-2" type="date" value={form.date_visited} onChange={(event) => setField("date_visited", event.target.value)} />
          </label>
        </div>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Notes/description</span>
          <textarea className="min-h-24 border border-black/15 bg-white px-3 py-2" value={form.notes} onChange={(event) => setField("notes", event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Tags</span>
          <input className="border border-black/15 bg-white px-3 py-2" placeholder="comma,separated,tags" value={form.tags} onChange={(event) => setField("tags", event.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.published} onChange={(event) => setField("published", event.target.checked)} />
          Published
        </label>

        <div className="flex gap-2">
          <button
            className="flex-1 border border-black bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            type="button"
            disabled={(!upload?.originalUrl && !editing) || disabled}
            onClick={saveSign}
          >
            {editing ? "Update sign" : "Save sign"}
          </button>
          {editing && (
            <button className="border border-black/15 px-4 py-2 text-sm hover:border-black" type="button" disabled={disabled} onClick={deleteCurrentSign}>
              Delete
            </button>
          )}
        </div>

        {!upload?.originalUrl && !editing && !busy && (
          <p className="font-mono text-xs uppercase text-black/45">Upload an image before saving.</p>
        )}
        {(busy || message || upload?.warning) && (
          <p className="font-mono text-xs uppercase text-black/55">{busy || message || upload?.warning}</p>
        )}
      </section>

      <section className="max-h-[78vh] overflow-auto border border-black/10 bg-white">
        <div className="sticky top-0 border-b border-black/10 bg-white p-3 font-mono text-[11px] uppercase text-black/45">
          {signs.length} signs
        </div>
        <div className="divide-y divide-black/10">
          {signs.map((sign) => (
            <button
              key={sign.id}
              className="grid w-full grid-cols-[56px_1fr] gap-3 p-3 text-left hover:bg-black/[0.03]"
              type="button"
              onClick={() => editSign(sign)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sign.image_processed_url || sign.image_original_url} alt="" className="h-14 w-14 object-contain" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{sign.restaurant_name || "Untitled sign"}</span>
                <span className="mt-1 block font-mono text-[11px] uppercase text-black/45">
                  {[sign.borough || "Unknown", sign.published ? "Published" : "Draft"].join(" / ")}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
