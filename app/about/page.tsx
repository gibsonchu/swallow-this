import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#fdfdf9] px-4 py-5 text-[#151515] md:px-7">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-3 border-b border-black/10 pb-5">
        <div>
          <p className="font-mono text-[11px] uppercase text-black/45">About</p>
          <h1 className="mt-1 max-w-3xl text-4xl font-semibold leading-[0.95] md:text-6xl">
            Choking Hazard Signs
          </h1>
        </div>
        <nav className="flex gap-4 text-sm font-medium">
          <Link className="text-black/45 hover:text-black" href="/">Archive</Link>
          <Link className="text-black/45 hover:text-black" href="/map">Map</Link>
          <Link className="text-black/45 hover:text-black" href="/submit">Submit</Link>
        </nav>
      </header>

      <article className="mx-auto max-w-3xl text-[19px] leading-8 text-black/80">
        <p className="font-mono text-xs uppercase leading-5 text-black/45">
          A public archive of choking hazard signs collected around New York City.
        </p>

        <p className="mt-8">
          New York has a particular talent for making bureaucratic objects feel personal. A notice taped
          near a host stand, a laminated warning by the bathrooms, a sign wedged into a menu case: these
          small public instructions are usually designed to disappear into the background. This archive is
          for the ones that do not.
        </p>

        <p className="mt-6">
          Choking hazard signs sit at a funny intersection of public health, restaurant design, neighborhood
          texture, and accidental poetry. They are direct and anxious, often generic, sometimes handmade,
          occasionally beautiful. The archive treats them as found objects rather than jokes: a loose survey
          of typography, placement, wear, language, and the strange intimacy of being warned while eating.
        </p>

        <p className="mt-6">
          The collection is intentionally minimal. Each entry preserves the image, restaurant, location,
          date visited, designer when known, and a few notes. Public submissions are reviewed before they
          appear, so the archive can grow without losing its point of view.
        </p>

        <p className="mt-6">
          If you see one, submit it. The best entries are not necessarily rare or polished. They are signs
          that make the room around them more visible.
        </p>
      </article>
    </main>
  );
}
