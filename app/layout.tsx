import type { Metadata } from "next";
import { Inter, Poetsen_One } from "next/font/google";
import "./globals.css";
import { THEME_INIT_SCRIPT } from "@/components/theme-toggle";
import { AuthProvider } from "@/lib/auth/provider";

/**
 * The KGKP brand's own two voices (see kgkpdesign.md).
 *
 * Inter carries the interface, body copy and every heading — neutral,
 * premium, and unambiguous at 12px, which is where a display face falls
 * apart. Poetsen One, the source site's rounded display face, is kept for
 * `.display` hero moments only; it ships a single weight (400).
 */
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const poetsen = Poetsen_One({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-poetsen",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kaushalya Genius Kid Program — Milestone Check",
  description:
    "A ten-minute milestone check for children aged 0–6, across six areas of brain development, with a keepsake report and activities to do at home.",
};

import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${inter.variable} ${poetsen.variable}`}>
        <AuthProvider>{children}</AuthProvider>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
