"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PlaceAutocomplete } from "@/components/PlaceAutocomplete";
import type { SignRecord } from "@/types/sign";

type UploadState = {
  originalUrl: string;
  processedUrl: string;
  warning?: string;
};

type ImageEdits = {
  zoom: number;
  x: number;
  y: number;
  rotation: number;
  brightness: number;
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
  restaurant_website_url: string;
  borough: string;
  neighborhood: string;
  notes: string;
  designer_url: string;
  tags: string;
  date_collected: string;
  date_visited: string;
  published: boolean;
  status: string;
  submitted_at: string;
  restaurants_using_design: string;
  submitter_name: string;
  featured: boolean;
  sort_order: string;
};

const today = new Date().toISOString().slice(0, 10);
const initialImageEdits: ImageEdits = {
  zoom: 1,
  x: 0,
  y: 0,
  rotation: 0,
  brightness: 100,
};

const initialForm: SignForm = {
  restaurant_name: "",
  designer: "",
  place_id: "",
  formatted_address: "",
  latitude: "",
  longitude: "",
  google_maps_url: "",
  restaurant_website_url: "",
  borough: "",
  neighborhood: "",
  notes: "",
  designer_url: "",
  tags: "",
  date_collected: today,
  date_visited: today,
  published: false,
  status: "draft",
  submitted_at: "",
  restaurants_using_design: "",
  submitter_name: "Gibson Chu",
  featured: false,
  sort_order: "",
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
    restaurant_website_url: sign.restaurant_website_url || "",
    borough: sign.borough || "",
    neighborhood: sign.neighborhood || "",
    notes: sign.notes || "",
    designer_url: sign.designer_url || "",
    tags: sign.tags || "",
    date_collected: sign.date_collected || sign.date_visited || today,
    date_visited: sign.date_visited || sign.date_collected || today,
    published: Boolean(sign.published),
    status: sign.status || (sign.published ? "approved" : "draft"),
    submitted_at: sign.submitted_at || "",
    restaurants_using_design: sign.restaurants_using_design || "",
    submitter_name: sign.submitter_name || "Gibson Chu",
    featured: Boolean(sign.featured),
    sort_order: sign.sort_order || "",
  };
}

function featuredSort(a: SignRecord, b: SignRecord) {
  const aOrder = Number(a.sort_order || Number.MAX_SAFE_INTEGER);
  const bOrder = Number(b.sort_order || Number.MAX_SAFE_INTEGER);
  if (aOrder !== bOrder) return aOrder - bOrder;
  return (a.restaurant_name || "").localeCompare(b.restaurant_name || "");
}

function loadEditableImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the image for editing."));
    image.src = src;
  });
}

export function AdminUploader({ googleMapsApiKey }: { googleMapsApiKey?: string }) {
  const [form, setForm] = useState<SignForm>(initialForm);
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [imageEdits, setImageEdits] = useState<ImageEdits>(initialImageEdits);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [signs, setSigns] = useState<SignRecord[]>([]);
  const [placeResetKey, setPlaceResetKey] = useState(0);

  const imageToShow = upload?.processedUrl || upload?.originalUrl;
  const editing = Boolean(form.id);
  const disabled = useMemo(() => Boolean(busy), [busy]);
  const librarySigns = useMemo(() => [...signs].sort(featuredSort), [signs]);

  const loadSigns = useCallback(async () => {
    const response = await fetch("/api/signs?all=1");
    const result = await response.json();
    setSigns(result.signs || []);
  }, []);

  const setField = (field: keyof SignForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const setImageEdit = (field: keyof ImageEdits, value: number) => {
    setImageEdits((current) => ({ ...current, [field]: value }));
  };

  const resetForm = useCallback(() => {
    setForm({ ...initialForm, date_collected: today, date_visited: today });
    setUpload(null);
    setImageEdits(initialImageEdits);
    setMessage("");
    setPlaceResetKey((key) => key + 1);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadSigns());
  }, [loadSigns]);

  useEffect(() => {
    const handleNewSign = () => resetForm();
    window.addEventListener("admin:new-sign", handleNewSign);
    return () => window.removeEventListener("admin:new-sign", handleNewSign);
  }, [resetForm]);

  const handlePlaceSelected = useCallback((place: {
    place_id: string;
    restaurant_name: string;
    formatted_address: string;
    latitude: string;
    longitude: string;
    google_maps_url: string;
    restaurant_website_url: string;
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
    setImageEdits(initialImageEdits);
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
      setMessage("Upload An Image Before Saving.");
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
        status: form.published ? "approved" : form.status || "draft",
      }),
    });
    const result = await response.json();
    setBusy("");

    if (!response.ok) {
      setMessage(result.error || "Save Failed");
      return;
    }

    setMessage(result.warning || `${editing ? "Updated" : "Saved"} in Google Sheets.`);
    resetForm();
    await loadSigns();
  };

  const editSign = (sign: SignRecord) => {
    setForm(formFromSign(sign));
    setUpload({ originalUrl: sign.image_original_url, processedUrl: sign.image_processed_url });
    setImageEdits(initialImageEdits);
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
    setMessage("Removed From Google Sheets.");
    await loadSigns();
  };

  const applyImageEdits = async () => {
    if (!imageToShow) {
      setMessage("Upload An Image Before Editing.");
      return;
    }

    setBusy("Applying Edits");
    setMessage("");

    try {
      const image = await loadEditableImage(imageToShow);
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 1500;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not edit the image in this browser.");

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.filter = `brightness(${imageEdits.brightness}%)`;
      context.translate(canvas.width / 2 + imageEdits.x, canvas.height / 2 + imageEdits.y);
      context.rotate((imageEdits.rotation * Math.PI) / 180);

      const baseScale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
      const scale = baseScale * imageEdits.zoom;
      context.drawImage(
        image,
        -(image.naturalWidth * scale) / 2,
        -(image.naturalHeight * scale) / 2,
        image.naturalWidth * scale,
        image.naturalHeight * scale,
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((nextBlob) => {
          if (nextBlob) resolve(nextBlob);
          else reject(new Error("Could not export the edited image."));
        }, "image/webp", 0.9);
      });

      const data = new FormData();
      data.append("file", new File([blob], `edited-sign-${Date.now()}.webp`, { type: "image/webp" }));

      const response = await fetch("/api/upload", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Edited image upload failed");

      setUpload((current) => ({
        originalUrl: current?.originalUrl || result.url,
        processedUrl: result.url,
        warning: result.warning,
      }));
      setImageEdits(initialImageEdits);
      setMessage("Edits Applied.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Image editing failed.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)_360px]">
      <section className="grid content-start gap-4">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Image</span>
          <input
            className="cursor-pointer border border-black/15 bg-white p-2 text-sm file:mr-3 file:cursor-pointer file:border file:border-black file:bg-black file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-white hover:file:text-black"
            type="file"
            accept="image/*"
            onChange={(event) => handleSingleFile(event.target.files?.[0])}
          />
        </label>

        <div className="aspect-[4/5] overflow-hidden border border-black/10 bg-white">
          {imageToShow ? (
            <div className="grid h-full w-full place-items-center overflow-hidden p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageToShow}
                alt="Upload preview"
                className="archive-image max-h-full max-w-full object-contain object-center"
                style={{
                  filter: `brightness(${imageEdits.brightness}%)`,
                  transform: `translate(${imageEdits.x / 8}px, ${imageEdits.y / 8}px) rotate(${imageEdits.rotation}deg) scale(${imageEdits.zoom})`,
                }}
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-black/40">
              Image preview
            </div>
          )}
        </div>

        {imageToShow && (
          <div className="grid gap-3 border border-black/10 bg-white p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">Quick Image Edit</span>
              <button
                className="font-mono text-[11px] uppercase text-black/45 hover:text-black"
                type="button"
                onClick={() => setImageEdits(initialImageEdits)}
              >
                Reset
              </button>
            </div>
            <label className="grid gap-1">
              <span className="font-mono text-[10px] uppercase text-black/45">Crop / Zoom</span>
              <input type="range" min="1" max="2.5" step="0.01" value={imageEdits.zoom} onChange={(event) => setImageEdit("zoom", Number(event.target.value))} />
            </label>
            <label className="grid gap-1">
              <span className="font-mono text-[10px] uppercase text-black/45">X Axis</span>
              <input type="range" min="-500" max="500" step="1" value={imageEdits.x} onChange={(event) => setImageEdit("x", Number(event.target.value))} />
            </label>
            <label className="grid gap-1">
              <span className="font-mono text-[10px] uppercase text-black/45">Y Axis</span>
              <input type="range" min="-500" max="500" step="1" value={imageEdits.y} onChange={(event) => setImageEdit("y", Number(event.target.value))} />
            </label>
            <label className="grid gap-1">
              <span className="font-mono text-[10px] uppercase text-black/45">Rotation</span>
              <input type="range" min="-20" max="20" step="0.25" value={imageEdits.rotation} onChange={(event) => setImageEdit("rotation", Number(event.target.value))} />
            </label>
            <label className="grid gap-1">
              <span className="font-mono text-[10px] uppercase text-black/45">Brightness</span>
              <input type="range" min="60" max="150" step="1" value={imageEdits.brightness} onChange={(event) => setImageEdit("brightness", Number(event.target.value))} />
            </label>
            <button
              className="border border-black bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
              type="button"
              disabled={disabled}
              onClick={applyImageEdits}
            >
              Apply Edits To Image
            </button>
          </div>
        )}
      </section>

      <section className="grid content-start gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{editing ? "Edit Sign" : "New Sign"}</h2>
          {editing && (
            <button className="border border-black/15 px-3 py-1 text-sm hover:border-black" type="button" onClick={resetForm}>
              New
            </button>
          )}
        </div>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Restaurant Name</span>
          <input className="border border-black/15 bg-white px-3 py-2" value={form.restaurant_name} onChange={(event) => setField("restaurant_name", event.target.value)} />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Submitter Name</span>
          <input className="border border-black/15 bg-white px-3 py-2" value={form.submitter_name} onChange={(event) => setField("submitter_name", event.target.value)} />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Sort Order</span>
          <input className="border border-black/15 bg-white px-3 py-2" inputMode="numeric" value={form.sort_order} onChange={(event) => setField("sort_order", event.target.value)} />
        </label>

        <PlaceAutocomplete apiKey={googleMapsApiKey} resetKey={placeResetKey} onPlaceSelected={handlePlaceSelected} />

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Google Maps URL</span>
          <input className="border border-black/15 bg-white px-3 py-2" value={form.google_maps_url} onChange={(event) => setField("google_maps_url", event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Restaurant Website URL</span>
          <input className="border border-black/15 bg-white px-3 py-2" value={form.restaurant_website_url} onChange={(event) => setField("restaurant_website_url", event.target.value)} />
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Borough</span>
            <select className="border border-black/15 bg-white px-3 py-2" value={form.borough} onChange={(event) => setField("borough", event.target.value)}>
              <option value="">Unknown</option>
              <option value="Manhattan">Manhattan</option>
              <option value="Brooklyn">Brooklyn</option>
              <option value="Queens">Queens</option>
              <option value="Bronx">Bronx</option>
              <option value="Staten Island">Staten Island</option>
              <option value="New Jersey">New Jersey</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Date Visited</span>
            <input className="border border-black/15 bg-white px-3 py-2" type="date" value={form.date_visited} onChange={(event) => setField("date_visited", event.target.value)} />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Designer</span>
            <input className="border border-black/15 bg-white px-3 py-2" value={form.designer} onChange={(event) => setField("designer", event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Designer Website URL</span>
            <input className="border border-black/15 bg-white px-3 py-2" value={form.designer_url} onChange={(event) => setField("designer_url", event.target.value)} />
          </label>
        </div>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">List Of Restaurants Also Using This Design</span>
          <textarea className="min-h-20 border border-black/15 bg-white px-3 py-2" value={form.restaurants_using_design} onChange={(event) => setField("restaurants_using_design", event.target.value)} />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Notes</span>
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
            {editing ? "Update Sign" : "Save Sign"}
          </button>
          {editing && (
            <button className="border border-black/15 px-4 py-2 text-sm hover:border-black" type="button" disabled={disabled} onClick={deleteCurrentSign}>
              Delete
            </button>
          )}
        </div>

        {!upload?.originalUrl && !editing && !busy && (
          <p className="font-mono text-xs uppercase text-black/45">Upload An Image Before Saving.</p>
        )}
        {(busy || message || upload?.warning) && (
          <p className="font-mono text-xs uppercase text-black/55">{busy || message || upload?.warning}</p>
        )}
      </section>

      <section className="max-h-[78vh] overflow-auto border border-black/10 bg-white">
        <div className="sticky top-0 z-20 border-b border-black/10 bg-white p-3 font-mono text-[11px] uppercase text-black shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          Library ({librarySigns.length})
        </div>
        <div className="divide-y divide-black/10">
          {librarySigns.map((sign) => (
            <button
              key={sign.id}
              className="grid w-full grid-cols-[56px_1fr] gap-3 p-3 text-left hover:bg-black/[0.03]"
              type="button"
              onClick={() => editSign(sign)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sign.image_processed_url || sign.image_original_url} alt="" className="archive-image h-14 w-14 object-contain object-center" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{sign.restaurant_name || "Untitled Sign"}</span>
                <span className="mt-1 block font-mono text-[11px] uppercase text-black/45">
                  {[sign.sort_order ? `#${sign.sort_order}` : "No Order", sign.borough || "Unknown", sign.status === "pending" ? "Pending" : sign.published ? "Published" : "Draft"].join(" / ")}
                </span>
              </span>
            </button>
          ))}
          {librarySigns.length === 0 && (
            <p className="p-4 text-sm text-black/45">
              No Library Records.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
