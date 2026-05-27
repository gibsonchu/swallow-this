import { SignMap } from "@/components/SignMap";
import { SiteHeader } from "@/components/SiteHeader";
import { listSigns } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const signs = await listSigns({ publishedOnly: true });

  return (
    <main className="bg-[#fdfdf9] text-[#151515]">
      <SiteHeader active="map" />
      <SignMap signs={signs} />
    </main>
  );
}
