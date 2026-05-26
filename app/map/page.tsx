import Link from "next/link";
import { SignMap } from "@/components/SignMap";
import { listSigns } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const signs = await listSigns({ publishedOnly: true });

  return (
    <main className="min-h-screen bg-[#fdfdf9] text-[#151515]">
      <header className="flex items-center justify-between border-b border-black/10 px-4 py-4 md:px-7">
        <div>
          <h1 className="text-2xl font-semibold leading-none">Map</h1>
          <p className="mt-1 font-mono text-[11px] uppercase text-black/45">
            Choking Hazard Signs / {signs.length} published
          </p>
        </div>
        <Link className="text-sm font-semibold text-black/45 hover:text-black" href="/">
          Archive
        </Link>
      </header>
      <SignMap signs={signs} />
    </main>
  );
}
