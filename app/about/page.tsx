import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#fdfdf9] px-4 py-5 text-[#151515] md:px-7">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-3 border-b border-black/10 pb-5">
        <div>
          <p className="font-mono text-[11px] uppercase text-black/45">About</p>
          <Link href="/" className="display-title mt-1 block max-w-3xl whitespace-nowrap text-3xl leading-[0.9] md:text-4xl">
            Choking Hazard Signs
          </Link>
        </div>
        <nav className="flex gap-4 text-sm font-medium">
          <Link className="text-black/45 hover:text-black" href="/">Library</Link>
          <Link className="text-black/45 hover:text-black" href="/map">Map</Link>
          <Link className="text-black/45 hover:text-black" href="/contact">Contact</Link>
        </nav>
      </header>

      <figure className="mx-auto mb-12 max-w-3xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/about/current-city-poster.png"
          alt="Current city-issued choking first aid poster"
          className="mx-auto max-h-[760px] w-full object-contain"
        />
        <figcaption className="mt-3 font-mono text-[11px] uppercase leading-5 text-black/45">
          The current city-issued choking first aid poster, redesigned in 2010 by graphics editors at The New York Times for the NYC Department of Health.
        </figcaption>
      </figure>

      <article className="mx-auto mb-24 max-w-3xl text-[19px] leading-8 text-black/80 md:mb-36">
        <p>
          In 1978, New York City passed a law requiring restaurants to publicly display instructions for helping someone who is choking. Today, the regulation lives on in New York City Administrative Code § 17-172:
        </p>

        <blockquote className="my-8 border-l border-black/20 pl-5 italic text-black">
          <p>
            “Every establishment where food is sold and space is designated specifically as eating areas shall have posted in a conspicuous place, easily accessible to all employees and customers, a sign graphically depicting the Heimlich Maneuver or a comparable technique instructing on how to dislodge food from a choking person.”
          </p>
          <cite className="mt-3 block font-mono text-[11px] uppercase not-italic text-black/45">
            <a className="underline decoration-black/25 underline-offset-2 hover:text-black" href="/about/nyc-code-17-172.pdf" target="_blank" rel="noreferrer">
              New York City Administrative Code § 17-172
            </a>
          </cite>
        </blockquote>

        <p className="mt-6">
          The Department of Health provides an official version of the poster for free. Most restaurants use this, but as it turns out, many don’t.
        </p>

        <p className="mt-6">
          For the past five years, I’ve been photographing the custom choking hazard signs scattered across restaurants, bars, cafes, and takeout spots throughout New York City. What started as noticing the occasional quirky poster slowly became an ongoing archive of a very specific kind of urban creativity: the ways businesses reinterpret one of the city’s most mundane legal requirements.
        </p>

        <p className="mt-6">
          These signs sit at a fascinating intersection of design, regulation, hospitality, and branding space. From a city planning perspective, they reveal something important about how cities work. New York mandates the information, but not necessarily the aesthetic. That small gap between compliance and interpretation creates room for expression and many restaurants have turned that space into a creative canvas.
        </p>

        <p className="mt-6">
          For the eagle-eyed, they become small neighborhood markers, interior design objects, conversation starters, and in some cases, collectible works of art. Restaurants have commissioned illustrators, graphic designers, painters, and sign makers to reinterpret them as part of their identity. Some establishments have reportedly spent hundreds of dollars creating custom versions rather than hanging the free city-issued poster. Some signs are hand-painted. Some are framed like fine art. Some look like comic books, vintage travel advertisements, punk flyers, instruction manuals, tarot cards, or underground zines. A lot of these, ironically, become barely legible. All together, they form a creative visual history of New York restaurant culture.
        </p>

        <p className="mt-6">
          This project is an attempt to document these as restaurants come and go.
        </p>

        <p className="mt-6">
          I’m currently working on a longer cultural criticism piece about what these signs reveal about New York City: its restaurants, its aesthetics, its systems of regulation, and the quiet ways creativity survives inside bureaucracy. The project also draws from the overlooked history of the posters themselves, from Parsons School of Design students redesigning the city’s original sign in the 1990s to the later redesign led by graphics editors at The New York Times.
        </p>

        <p className="mt-6">
          Alongside the archive, I’m producing a printed zine featuring some of the most memorable signs collected across the city.
        </p>

        <p className="mt-6">
          If you’ve spotted a choking sign that belongs here, or if you yourself have designed, painted, commissioned, or own one, I’d love to hear from you.
        </p>

        <Link className="mt-10 inline-flex border border-black bg-black px-5 py-3 text-base font-semibold leading-none text-white hover:bg-white hover:text-black" href="/contact">
          Contact
        </Link>
      </article>
    </main>
  );
}
