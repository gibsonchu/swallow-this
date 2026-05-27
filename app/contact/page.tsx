import { SiteHeader } from "@/components/SiteHeader";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#fdfdf9] text-[#151515]">
      <SiteHeader active="contact" />

      <article className="mx-auto mb-28 max-w-3xl px-4 py-10 text-[22px] leading-9 text-black/80 md:mb-40 md:px-7 md:text-[26px] md:leading-10">
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
