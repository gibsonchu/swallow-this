import { ArchiveExplorer } from "@/components/ArchiveExplorer";
import { listSigns } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export default async function Home() {
  const signs = await listSigns({ publishedOnly: true });

  return <ArchiveExplorer signs={signs} />;
}
