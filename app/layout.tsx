import type { Metadata } from "next";
import { IBM_Plex_Sans, Newsreader } from "next/font/google";
import "./globals.css";
import { THEME_INIT_SCRIPT } from "@/components/theme-toggle";

/**
 * Newsreader for headings, IBM Plex Sans for interface and data.
 *
 * The serif is doing real work: a heading that tells a parent something about
 * their child should read as written by a person. Plex handles everything
 * operational — it holds up at 12px where a serif does not, and its Devanagari
 * sibling is the path to Hindi without changing the type system.
 */
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kaushalya Kids Genius — Development Check",
  description:
    "A ten-minute developmental check for children aged 0 to 6, with a growth report and activities to do at home.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${newsreader.variable} ${plex.variable}`}>
        {children}
      </body>
    </html>
  );
}
