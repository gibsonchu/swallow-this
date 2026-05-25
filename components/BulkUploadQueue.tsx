"use client";

type QueueItem = {
  name: string;
  originalUrl?: string;
  processedUrl?: string;
  status: string;
};

export function BulkUploadQueue({ items }: { items: QueueItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="grid gap-2">
      <h2 className="text-sm font-semibold uppercase">Bulk queue</h2>
      <div className="grid gap-px border border-black/10">
        {items.map((item, index) => (
          <div key={`${item.name}-${index}`} className="grid grid-cols-[48px_1fr] gap-3 bg-white p-2">
            {item.processedUrl || item.originalUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.processedUrl || item.originalUrl}
                alt=""
                className="h-12 w-12 border border-black/10 object-contain"
              />
            ) : (
              <div className="h-12 w-12 border border-black/10 bg-black/5" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm">{item.name}</p>
              <p className="font-mono text-[11px] uppercase text-black/50">{item.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
