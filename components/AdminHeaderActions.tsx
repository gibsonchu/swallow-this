"use client";

export function AdminHeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <button
        className="border border-black bg-black px-3 py-2 text-sm font-medium text-white hover:bg-white hover:text-black"
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent("admin:new-sign"))}
      >
        New Sign
      </button>
      <form action="/api/admin/logout" method="post">
        <button className="border border-black/20 px-3 py-2 text-sm hover:border-black" type="submit">
          Log Out
        </button>
      </form>
    </div>
  );
}
