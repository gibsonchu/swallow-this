import Link from "next/link";
import { SubmitSignForm } from "@/components/SubmitSignForm";

export const dynamic = "force-dynamic";

export default function SubmitPage() {
  return (
    <main className="min-h-screen bg-[#fdfdf9] px-4 py-5 text-[#151515] md:px-7">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-black/10 pb-5">
        <div>
          <p className="font-mono text-[11px] uppercase text-black/45">Saw a sign you&apos;d like to include?</p>
          <h1 className="display-title mt-1 text-3xl leading-none">Submit A Sign</h1>
        </div>
        <nav className="flex gap-4 text-sm font-medium">
          <Link className="text-black/45 hover:text-black" href="/">Index</Link>
          <Link className="text-black/45 hover:text-black" href="/map">Map</Link>
          <Link className="text-black/45 hover:text-black" href="/about">About</Link>
        </nav>
      </header>

      <SubmitSignForm googleMapsApiKey={process.env.GOOGLE_MAPS_API_KEY} />
    </main>
  );
}
