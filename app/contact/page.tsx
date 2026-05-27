import { SiteHeader } from "@/components/SiteHeader";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#fdfdf9] text-[#151515]">
      <SiteHeader active="contact" />

      <article className="mx-auto mb-28 max-w-3xl px-4 py-10 text-[19px] leading-8 text-black/80 md:mb-40 md:px-7">
        <h1 className="mb-8 text-4xl font-semibold tracking-normal text-black md:text-5xl">Contact</h1>

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
