import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { THEME_INIT_SCRIPT } from "@/components/theme-toggle";

/**
 * IBM Plex Sans everywhere — headings and interface both. One rounded,
 * highly-legible family reads as friendly at every size, and its Devanagari
 * sibling is the path to Hindi without changing the type system.
 */
const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kaushalya Genius Kid Program — Milestones Check",
  description:
    "A playful ten-minute developmental check for children aged 0 to 6, with a friendly report and fun activities to do at home.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={plex.variable}>{children}</body>
    </html>
  );
}
