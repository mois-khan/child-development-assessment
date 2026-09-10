/**
 * One-off generator for the PWA icon PNGs — run with `node scripts/gen-icons.js`.
 *
 * Not part of the build; the outputs are committed to public/ like any other
 * static asset. Kept as a script rather than a throwaway one-liner so the
 * icon can be regenerated if the brand mark ever changes.
 */
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const BRAND_600 = "#4d1435";
const BRAND_500 = "#8c3a63";
const CORAL_500 = "#ef816c";

// Same star path IconStarFilled already uses everywhere in the app for
// "achievement" — the family count pill, the dashboard's stat tile. Reusing
// it here means the installed app icon and the in-app iconography agree.
const STAR_PATH = "m12 3.4 2.7 5.5 6 .9-4.35 4.24 1.03 6-5.38-2.83-5.38 2.83 1.03-6L3.3 9.8l6-.9L12 3.4Z";

/**
 * @param {number} size Canvas size in px (square).
 * @param {number} starScale Star's box size as a fraction of the canvas —
 *   kept well inside Android's maskable safe zone (inner ~80%).
 */
function iconSvg(size, starScale) {
  const starSize = size * starScale;
  const offset = (size - starSize) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BRAND_600}"/>
      <stop offset="55%" stop-color="${BRAND_500}"/>
      <stop offset="100%" stop-color="${CORAL_500}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#g)"/>
  <svg x="${offset}" y="${offset}" width="${starSize}" height="${starSize}" viewBox="0 0 24 24">
    <path d="${STAR_PATH}" fill="#faf7f5"/>
  </svg>
</svg>`;
}

const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  // "any" purpose — the full mark, comfortable margins, used as the
  // favicon and the generic manifest icon.
  { file: "icon-192.png", size: 192, starScale: 0.56 },
  { file: "icon-512.png", size: 512, starScale: 0.56 },
  // "maskable" — background must run edge-to-edge (Android crops the
  // shape itself), so the star sits smaller, inside the ~80% safe zone.
  { file: "maskable-192.png", size: 192, starScale: 0.42 },
  { file: "maskable-512.png", size: 512, starScale: 0.42 },
];

for (const t of targets) {
  const svg = iconSvg(t.size, t.starScale);
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: t.size } });
  const png = resvg.render().asPng();
  fs.writeFileSync(path.join(outDir, t.file), png);
  console.log("wrote", t.file);
}
