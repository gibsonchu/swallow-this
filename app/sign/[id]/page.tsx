import Link from "next/link";
import { notFound } from "next/navigation";
import { getSignById } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export default async function SignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sign = await getSignById(id);

  if (!sign) notFound();

  const imageUrl = sign.image_processed_url || sign.image_original_url;
  const label = sign.restaurant_name || "Unknown restaurant";
  const dateVisited = sign.date_visited || sign.date_collected;
  const tags = sign.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return (
    <main className="min-h-screen bg-[#fbf7ee] text-[#151515]">
      <header className="border-b border-black/10 px-4 py-3">
        <Link className="font-mono text-xs uppercase text-black/55 hover:text-black" href="/">
          Back to archive
        </Link>
      </header>
      <article className="grid gap-6 px-4 py-6 md:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] md:px-6">
        <div className="border border-black/10 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={label} className="max-h-[78vh] w-full object-contain p-4" />
        </div>

        <section className="grid content-start gap-5">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">{label}</h1>
          </div>

          <dl className="grid gap-px overflow-hidden border border-black/10 text-sm">
            {[
              ["Designer", sign.designer],
              ["Date visited", dateVisited],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[130px_1fr] bg-white">
                <dt className="border-r border-black/10 p-3 font-mono text-[11px] uppercase text-black/45">
                  {label}
                </dt>
                <dd className="p-3">{value || "Unknown"}</dd>
              </div>
            ))}
          </dl>

          {sign.google_maps_url && (
            <a
              className="inline-flex w-fit border border-black px-3 py-2 text-sm hover:bg-black hover:text-white"
              href={sign.google_maps_url}
              target="_blank"
              rel="noreferrer"
            >
              Open in Google Maps
            </a>
          )}

          {sign.notes && <p className="max-w-prose text-sm leading-6 text-black/75">{sign.notes}</p>}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="border border-black/15 px-2 py-1 font-mono text-[11px] uppercase">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </section>
      </article>
    </main>
  );
}
