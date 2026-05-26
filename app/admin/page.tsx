import { AdminUploader } from "@/components/AdminUploader";
import { isAdminAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fdfdf9] px-4 text-[#151515]">
        <form
          className="grid w-full max-w-sm gap-4 border border-black/10 bg-white p-5"
          action="/api/admin/login"
          method="post"
        >
          <div>
            <h1 className="display-title text-2xl leading-none">Choking Hazard Signs Admin</h1>
            <p className="mt-1 text-sm text-black/55">Enter the archive password.</p>
          </div>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Password</span>
            <input className="border border-black/15 px-3 py-2" name="password" type="password" />
          </label>
          <button className="border border-black bg-black px-4 py-2 text-sm font-medium text-white" type="submit">
            Log in
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fdfdf9] px-4 py-5 text-[#151515] md:px-7">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-black/10 pb-5">
        <div>
          <h1 className="display-title text-3xl leading-none">Choking Hazard Signs Admin</h1>
          <p className="mt-2 text-sm text-black/55">Upload, annotate, edit, and publish signs.</p>
        </div>
        <form action="/api/admin/logout" method="post">
          <button className="border border-black/20 px-3 py-2 text-sm hover:border-black" type="submit">
            Log out
          </button>
        </form>
      </header>
      <AdminUploader googleMapsApiKey={process.env.GOOGLE_MAPS_API_KEY} />
    </main>
  );
}
