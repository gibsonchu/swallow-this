import Link from "next/link";
import { SignMap } from "@/components/SignMap";
import { listSigns } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";
const submitUrl = "https://x.com/gibsontchu";

export default async function MapPage() {
  const signs = await listSigns({ publishedOnly: true });

  return (
    <main className="bg-[#fdfdf9] text-[#151515]">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-black/10 px-4 py-5 md:px-7">
        <div>
          <p className="font-mono text-[11px] uppercase text-black/45">Map</p>
          <Link href="/" className="display-title mt-1 block max-w-3xl whitespace-nowrap text-3xl leading-[0.9] md:text-4xl">
            Choking Hazard Signs
          </Link>
        </div>
        <nav className="flex gap-4 text-sm font-medium">
          <Link className="text-black/45 hover:text-black" href="/">Index</Link>
          <Link className="text-black/45 hover:text-black" href="/about">About</Link>
          <Link className="text-black/45 hover:text-black" href={submitUrl} target="_blank" rel="noreferrer">Submit</Link>
        </nav>
      </header>
      <SignMap signs={signs} />
    </main>
  );
}
