"use client";

import { useCallback, useMemo, useState } from "react";
import { BulkUploadQueue } from "@/components/BulkUploadQueue";
import { PlaceAutocomplete } from "@/components/PlaceAutocomplete";

type UploadState = {
  originalUrl: string;
  processedUrl: string;
  warning?: string;
};

const initialForm = {
  sign_title: "",
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
  date_collected: new Date().toISOString().slice(0, 10),
  date_visited: new Date().toISOString().slice(0, 10),
  published: false,
};

export function AdminUploader({ googleMapsApiKey }: { googleMapsApiKey?: string }) {
  const [form, setForm] = useState(initialForm);
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [queue, setQueue] = useState<Array<{ name: string; originalUrl?: string; processedUrl?: string; status: string }>>([]);

  const imageToShow = upload?.processedUrl || upload?.originalUrl;

  const setField = (field: string, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
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

  const uploadFile = useCallback(async (nextFile: File) => {
    setBusy("Uploading");
    const data = new FormData();
    data.append("file", nextFile);

    const response = await fetch("/api/upload", { method: "POST", body: data });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Upload failed");
    setUpload({ originalUrl: result.url, processedUrl: "", warning: result.warning });
    setBusy("");
    return result.url as string;
  }, []);

  const handleSingleFile = async (nextFile: File | undefined) => {
    if (!nextFile) return;
    setFile(nextFile);
    setMessage("");
    try {
      await uploadFile(nextFile);
    } catch (error) {
      setBusy("");
      setMessage(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const saveSign = async () => {
    if (!upload?.originalUrl) {
      setMessage("Upload an image before saving.");
      return;
    }

    setBusy("Saving");
    const response = await fetch("/api/signs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        date_collected: form.date_visited,
        image_original_url: upload.originalUrl,
        image_processed_url: upload.processedUrl || upload.originalUrl,
      }),
    });
    const result = await response.json();
    setBusy("");

    if (!response.ok) {
      setMessage(result.error || "Save failed");
      return;
    }

    setMessage(result.warning || `Saved to Google Sheets${result.sign?.id ? `: ${result.sign.id}` : "."}`);
    setForm(initialForm);
    setUpload(null);
    setFile(null);
  };

  const handleBulk = async (files: FileList | null) => {
    if (!files?.length) return;
    const items = Array.from(files).map((item) => ({ name: item.name, status: "Queued" }));
    setQueue(items);

    for (const [index, nextFile] of Array.from(files).entries()) {
      setQueue((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index ? { ...item, status: "Uploading original" } : item,
        ),
      );

      try {
        const originalUrl = await uploadFile(nextFile);
        setQueue((current) =>
          current.map((item, itemIndex) =>
            itemIndex === index ? { ...item, originalUrl, status: "Ready for metadata" } : item,
          ),
        );
      } catch {
        setQueue((current) =>
          current.map((item, itemIndex) =>
            itemIndex === index ? { ...item, status: "Upload failed" } : item,
          ),
        );
      }
    }
  };

  const disabled = useMemo(() => Boolean(busy), [busy]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
      <section className="grid gap-5">
        <div className="grid gap-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Single image</span>
            <input
              className="border border-black/15 bg-white p-2"
              type="file"
              accept="image/*"
              onChange={(event) => handleSingleFile(event.target.files?.[0])}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Bulk images</span>
            <input
              className="border border-black/15 bg-white p-2"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => handleBulk(event.target.files)}
            />
          </label>
        </div>

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

        <BulkUploadQueue items={queue} />
      </section>

      <section className="grid content-start gap-4">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Restaurant name</span>
          <input className="border border-black/15 bg-white px-3 py-2" value={form.restaurant_name} onChange={(event) => setField("restaurant_name", event.target.value)} />
        </label>

        <PlaceAutocomplete
          apiKey={googleMapsApiKey}
          onPlaceSelected={handlePlaceSelected}
        />

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

        <div className="grid gap-3 sm:grid-cols-2">
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

        <button
          className="border border-black bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          type="button"
          disabled={!upload?.originalUrl || disabled}
          onClick={saveSign}
        >
          Save sign
        </button>

        {!upload?.originalUrl && !busy && (
          <p className="font-mono text-xs uppercase text-black/45">Upload an image before saving.</p>
        )}

        {(busy || message || upload?.warning) && (
          <p className="font-mono text-xs uppercase text-black/55">{busy || message || upload?.warning}</p>
        )}
      </section>
    </div>
  );
}
