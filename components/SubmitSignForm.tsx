"use client";

import { useCallback, useMemo, useState } from "react";
import { PlaceAutocomplete } from "@/components/PlaceAutocomplete";

type SubmissionForm = {
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
  date_visited: string;
};

const today = new Date().toISOString().slice(0, 10);

const initialForm: SubmissionForm = {
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
  date_visited: today,
};

export function SubmitSignForm({ googleMapsApiKey }: { googleMapsApiKey?: string }) {
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const canSubmit = useMemo(() => Boolean(file && form.restaurant_name && !busy), [busy, file, form.restaurant_name]);

  const setField = (field: keyof SubmissionForm, value: string) => {
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

  const chooseFile = (nextFile: File | undefined) => {
    if (!nextFile) return;
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setMessage("");
  };

  const submit = async () => {
    if (!file) {
      setMessage("Please add an image.");
      return;
    }

    setBusy(true);
    setMessage("");

    const data = new FormData();
    data.append("file", file);
    Object.entries(form).forEach(([key, value]) => data.append(key, value));

    const response = await fetch("/api/submit", { method: "POST", body: data });
    const result = await response.json();
    setBusy(false);

    if (!response.ok) {
      setMessage(result.error || "Submission failed.");
      return;
    }

    setForm({ ...initialForm, date_visited: today });
    setFile(null);
    setPreviewUrl("");
    setMessage(result.warning || "Submitted. It will show up after review.");
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
      <section className="grid content-start gap-4">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Image</span>
          <input className="border border-black/15 bg-white p-2" type="file" accept="image/*" onChange={(event) => chooseFile(event.target.files?.[0])} />
        </label>
        <div className="aspect-[4/5] border border-black/10 bg-white">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Submission preview" className="h-full w-full object-contain p-3" />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-black/40">
              Add the sign photo.
            </div>
          )}
        </div>
      </section>

      <section className="grid content-start gap-4">
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
          <span className="font-medium">Neighborhood</span>
          <input className="border border-black/15 bg-white px-3 py-2" value={form.neighborhood} onChange={(event) => setField("neighborhood", event.target.value)} />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Notes/description</span>
          <textarea className="min-h-24 border border-black/15 bg-white px-3 py-2" value={form.notes} onChange={(event) => setField("notes", event.target.value)} />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Tags</span>
          <input className="border border-black/15 bg-white px-3 py-2" placeholder="comma,separated,tags" value={form.tags} onChange={(event) => setField("tags", event.target.value)} />
        </label>

        <button
          className="border border-black bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          type="button"
          disabled={!canSubmit}
          onClick={submit}
        >
          {busy ? "Submitting" : "Submit for review"}
        </button>

        {message && <p className="font-mono text-xs uppercase text-black/55">{message}</p>}
      </section>
    </div>
  );
}
