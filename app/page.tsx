import { SignGrid } from "@/components/SignGrid";
import { listSigns } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export default async function Home() {
  const signs = await listSigns({ publishedOnly: true });

  return (
    <main className="min-h-screen bg-[#fbf7ee] text-[#151515]">
      <header className="grid gap-2 border-b border-black/10 px-3 py-4 sm:grid-cols-[1fr_auto] sm:items-end sm:px-5">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal sm:text-5xl">Swallow This</h1>
          <p className="mt-1 max-w-xl text-sm text-black/65 sm:text-base">
            An archive of choking hazard signs around New York City.
          </p>
        </div>
        <p className="font-mono text-[11px] uppercase text-black/50">{signs.length} published signs</p>
      </header>
      <SignGrid signs={signs} />
    </main>
  );
}
