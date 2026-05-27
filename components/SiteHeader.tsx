import Link from "next/link";

type PageKey = "library" | "map" | "about" | "contact";

const navItems: Array<{ key: PageKey; label: string; href: string }> = [
  { key: "library", label: "Library", href: "/" },
  { key: "map", label: "Map", href: "/map" },
  { key: "about", label: "About", href: "/about" },
  { key: "contact", label: "Contact", href: "/contact" },
];

export function SiteHeader({ active }: { active: PageKey }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-5 border-b border-black/10 px-5 py-6 md:px-10 md:py-8">
      <Link href="/" className="display-title block whitespace-nowrap text-3xl leading-[0.9] tracking-normal md:text-4xl">
        Choking Hazard Signs
      </Link>

      <nav className="flex flex-wrap gap-4 text-sm font-medium">
        {navItems.map((item) => {
          if (item.key === active) {
            return (
              <span key={item.key} className="text-black">
                {item.label}
              </span>
            );
          }

          return (
            <Link key={item.key} className="text-black/45 hover:text-black" href={item.href}>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
