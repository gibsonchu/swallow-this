import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#fdfdf9] px-4 py-5 text-[#151515] md:px-7">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-3 border-b border-black/10 pb-5">
        <div>
          <p className="font-mono text-[11px] uppercase text-black/45">Contact</p>
          <Link href="/" className="display-title mt-1 block max-w-3xl whitespace-nowrap text-3xl leading-[0.9] md:text-4xl">
            Choking Hazard Signs
          </Link>
        </div>
        <nav className="flex gap-4 text-sm font-medium">
          <Link className="text-black/45 hover:text-black" href="/">Library</Link>
          <Link className="text-black/45 hover:text-black" href="/map">Map</Link>
          <Link className="text-black/45 hover:text-black" href="/about">About</Link>
        </nav>
      </header>

      <article className="mx-auto mb-28 max-w-3xl text-[22px] leading-9 text-black/80 md:mb-40 md:text-[26px] md:leading-10">
        <p>
          Do you have a sign you&apos;d like to include in the library or know the designer for a sign? Reach out to me{" "}
          <a className="underline decoration-black/25 underline-offset-4 hover:text-black" href="https://x.com/gibsontchu" target="_blank" rel="noreferrer">
            @gibsontchu
          </a>
          .
        </p>
      </article>
    </main>
  );
}
