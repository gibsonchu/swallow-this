import type { Metadata } from "next";
import { Archivo_Black, Geist_Mono, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Choking Hazard Signs",
  description: "An index of choking hazard signs around New York City.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${geistMono.variable} ${archivoBlack.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        {children}
        <footer className="border-t border-black/10 bg-[#fdfdf9] px-5 py-5 font-mono text-[11px] text-black/45 md:px-10">
          <p className="mb-4 max-w-sm leading-5">
            An index of choking hazard signs around New York City.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Last Updated May 26, 2026</span>
            <span>
              Made By{" "}
              <Link className="underline decoration-black/25 underline-offset-2 hover:text-black" href="https://x.com/gibsontchu">
                @gibsontchu
              </Link>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
