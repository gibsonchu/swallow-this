import type { SignRecord } from "@/types/sign";
import { SignCard } from "@/components/SignCard";

export function SignGrid({ signs }: { signs: SignRecord[] }) {
  if (signs.length === 0) {
    return (
      <div className="border border-black/10 px-4 py-12 text-center text-sm text-black/60">
        No published signs yet.
      </div>
    );
  }

  return (
    <div className="archive-grid grid grid-cols-2 gap-x-12 gap-y-16 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {signs.map((sign) => (
        <SignCard key={sign.id} sign={sign} />
      ))}
    </div>
  );
}
