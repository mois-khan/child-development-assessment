import type { Metadata } from "next";
import { Sora, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { THEME_INIT_SCRIPT } from "@/components/theme-toggle";

/**
 * Two voices, deliberately.
 *
 * Sora carries every heading — a geometric, confident grotesk that reads as
 * agency-designed rather than a rounded "kids app" face. Plus Jakarta Sans
 * carries the interface and the report: neutral, premium, and unambiguous at
 * 12px, which is where a display face falls apart.
 */
const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display-raw",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kaushalya Genius Kid Program — Milestone Check",
  description:
    "A ten-minute milestone check for children aged 0–6, across six areas of brain development, with a keepsake report and activities to do at home.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${sora.variable} ${jakarta.variable}`}>{children}</body>
    </html>
  );
}
