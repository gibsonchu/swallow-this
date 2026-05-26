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
  usability_rating: string;
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
  usability_rating: "",
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
    usability_rating: sign.usability_rating || "",
  };
}

export function AdminUploader({ googleMapsApiKey }: { googleMapsApiKey?: string }) {
  const [form, setForm] = useState<SignForm>(initialForm);
  const [tab, setTab] = useState<"archive" | "submissions">("archive");
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [signs, setSigns] = useState<SignRecord[]>([]);

  const imageToShow = upload?.processedUrl || upload?.originalUrl;
  const editing = Boolean(form.id);
  const disabled = useMemo(() => Boolean(busy), [busy]);
  const pendingSigns = useMemo(() => signs.filter((sign) => sign.status === "pending"), [signs]);
  const archiveSigns = useMemo(() => signs.filter((sign) => sign.status !== "pending"), [signs]);
  const visibleSigns = tab === "submissions" ? pendingSigns : archiveSigns;

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

  const approveCurrentSign = async () => {
    if (!form.id) return;
    const originalUrl = upload?.originalUrl || signs.find((sign) => sign.id === form.id)?.image_original_url;
    const processedUrl = upload?.processedUrl || upload?.originalUrl || signs.find((sign) => sign.id === form.id)?.image_processed_url;

    setBusy("Approving");
    const response = await fetch("/api/signs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        date_collected: form.date_visited,
        image_original_url: originalUrl,
        image_processed_url: processedUrl || originalUrl,
        published: true,
        status: "approved",
      }),
    });
    const result = await response.json();
    setBusy("");

    if (!response.ok) {
      setMessage(result.error || "Approval Failed");
      return;
    }

    setMessage("Approved And Published.");
    resetForm();
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

        <PlaceAutocomplete apiKey={googleMapsApiKey} onPlaceSelected={handlePlaceSelected} />

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
            <span className="font-medium">Date Visited</span>
            <input className="border border-black/15 bg-white px-3 py-2" type="date" value={form.date_visited} onChange={(event) => setField("date_visited", event.target.value)} />
          </label>
        </div>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Designer Website URL</span>
          <input className="border border-black/15 bg-white px-3 py-2" value={form.designer_url} onChange={(event) => setField("designer_url", event.target.value)} />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Usability Rating</span>
          <select className="border border-black/15 bg-white px-3 py-2" value={form.usability_rating} onChange={(event) => setField("usability_rating", event.target.value)}>
            <option value="">Unrated</option>
            <option value="1">1 - Non-Functional</option>
            <option value="2">2 - Marginal</option>
            <option value="3">3 - Usable</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Usability Reasoning</span>
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
        {form.status === "pending" && (
          <p className="border border-black/10 bg-white p-3 font-mono text-xs uppercase text-black/55">
            Pending Public Submission.
          </p>
        )}

        <div className="flex gap-2">
          <button
            className="flex-1 border border-black bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            type="button"
            disabled={(!upload?.originalUrl && !editing) || disabled}
            onClick={saveSign}
          >
            {editing ? "Update Sign" : "Save Sign"}
          </button>
          {editing && form.status === "pending" && (
            <button className="border border-black bg-white px-4 py-2 text-sm hover:bg-black hover:text-white" type="button" disabled={disabled} onClick={approveCurrentSign}>
              Approve
            </button>
          )}
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
        <div className="sticky top-0 border-b border-black/10 bg-white">
          <div className="grid grid-cols-2">
            <button
              className={`border-r border-black/10 p-3 text-left font-mono text-[11px] uppercase ${tab === "archive" ? "text-black" : "text-black/40"}`}
              type="button"
              onClick={() => setTab("archive")}
            >
              Archive ({archiveSigns.length})
            </button>
            <button
              className={`p-3 text-left font-mono text-[11px] uppercase ${tab === "submissions" ? "text-black" : "text-black/40"}`}
              type="button"
              onClick={() => setTab("submissions")}
            >
              Submissions ({pendingSigns.length})
            </button>
          </div>
        </div>
        <div className="divide-y divide-black/10">
          {visibleSigns.map((sign) => (
            <button
              key={sign.id}
              className="grid w-full grid-cols-[56px_1fr] gap-3 p-3 text-left hover:bg-black/[0.03]"
              type="button"
              onClick={() => editSign(sign)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sign.image_processed_url || sign.image_original_url} alt="" className="h-14 w-14 object-contain" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{sign.restaurant_name || "Untitled Sign"}</span>
                <span className="mt-1 block font-mono text-[11px] uppercase text-black/45">
                  {[sign.borough || "Unknown", sign.status === "pending" ? "Pending" : sign.published ? "Published" : "Draft"].join(" / ")}
                </span>
              </span>
            </button>
          ))}
          {visibleSigns.length === 0 && (
            <p className="p-4 text-sm text-black/45">
              {tab === "submissions" ? "No Pending Submissions." : "No Archive Records."}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
