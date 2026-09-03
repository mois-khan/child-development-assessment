# Kaushalya Genius Kid Program (KGKP) — Design System Extraction

Source audited: `courses.kaushalyageniuskid.com` (built on the **Graphy** LMS platform, by Ru Education Pvt. Ltd.)
Pages audited: Home (marketing), KGKP Method, FAQ, Demo (lead form), Course Catalog (`/s/store`), Course Detail page, Category dropdown, floating contact widgets, footer, and the Graphy creator-admin backend (noted as out-of-scope/vendor UI).

> **Important structural finding:** This site is actually **two different design systems stitched together**, because it's a custom marketing site layered on top of a stock Graphy LMS storefront:
>
> 1. **Marketing/CMS layer** (Home, KGKP Method, FAQ, Demo, footer-with-callback-form) — fully custom-built, warm pastel palette, "Inter" + "Poetsen One" fonts, hand-drawn doodle accents, illustration-heavy.
> 2. **Graphy storefront/app shell** (course catalog grid, course detail page, cart, category filter, checkout) — Graphy's **default theme** with light re-skinning via CSS variables (maroon header text, but the primary action color reverts to Graphy's stock blue `#317AE7`). This is the inconsistency you'll most want to fix when you build your own portal — decide once whether "brand maroon" or "Graphy blue" is the one primary action color, and apply it everywhere.
> 3. **Graphy Creator Admin dashboard** (`/dashboard`) is 100% vendor/generic Graphy UI (mint-green accent, left sidebar) — not KGKP-branded at all, and not worth copying into your portal. Mentioned only so you don't mistake it for their design language.
>
> Below, everything is labeled by which layer it comes from.

---

## 1. Brand Personality

Warm, nurturing, playful-but-credible "parenting/edtech" tone. Deep wine/maroon for authority and trust, offset by candy-pastel supporting colors (coral, peach, mint, lavender, sky blue, olive) for warmth and childlike energy. Flat, rounded, storybook-style illustrations throughout (parents, babies, kids, brains, trees). Hand-drawn marker-stroke underlines beneath key headings. Pill-shaped buttons everywhere — no sharp corners on interactive elements.

---

## 2. Color System

### 2.1 Core brand tokens (from the site's own CSS custom properties)

```css
:root {
  --themeColor: #317AE7;        /* Graphy default blue — used as primary action color on storefront/app pages (buy buttons, category filter, links) */
  --themeBGColor: #EFF5FE;      /* pale blue tint, storefront backgrounds */
  --headerHeight: 100px;
  --headerTextColor: #4D1435;   /* brand maroon override, used for header/logo text */
  --headerBGColor: #ffffff;
  --footerTextColor: #FAF0F0;
  --themeCornerRadius: 25px;    /* the site's own "pill" radius token — reuse this */
  --themeGrayColor: #F5F5F5;
}
```

### 2.2 Marketing-layer palette (Home / KGKP Method / FAQ / Demo)

| Swatch | Hex | RGB | Usage |
|---|---|---|---|
| 🟣 Brand Maroon (primary) | `#4D1435` | 77,20,53 | Headings, logo wordmark, primary buttons (Login, hero CTA, Submit, Request A Callback), active nav underline color family, body copy on light bg |
| 🟠 Coral/Salmon (secondary) | `#EF816C` | 239,129,108 | Hero section background, footer background — the site's second signature color |
| 🍅 Tomato accent | `#FF6347` | 255,99,71 | Small accent text/icon color, occasional highlight |
| 🟢 Teal/Mint (section bg) | ~`#5FB6A6`–`#6EC0A9` band | — | "The KGKP Method" section background, "4 stages" section background (sampled visually; use `#5FB6A6` as nearest reference and re-sample from a screenshot if pixel-exact match matters) |
| 🍑 Peach (light) | `#F6E2D7` | 246,226,215 | Soft section backgrounds (KGKP Method hero band) |
| 🍑 Peach (mid) | `#F69B8A` | 246,155,138 | Illustration blob backgrounds |
| 🍑 Apricot | `#F2B095` | 242,176,149 | Card/illustration backgrounds |
| 🟡 Light apricot | `#FCD0AD` | 252,208,173 | Card backgrounds |
| 🟡 Pale yellow | `#FAEFB6` | 250,239,182 | Callback-form panel background, soft section fill |
| 🟣 Lavender | `#A696F7` | 166,150,247 | "6 to 15 Years" card header band, accent chips |
| 🟢 Mint-white | `#EDF7F5` | 237,247,245 | Very light section background |
| 🫒 Olive/Lime | `#C3CA31` | 195,202,49 | "Reading Program" pillar card background |
| 🔵 Sky Blue | `#A7DBF2` | 167,219,242 | "Encyclopaedic Knowledge" pillar card background |
| ⚪ White | `#FFFFFF` | 255,255,255 | Card surfaces, input backgrounds |
| 🟤 Dark maroon (testimonial bg) | `#4A0D33`–`#3D0A2A` band | — | Testimonial section background (near-black maroon), white text on top |

**Hand-drawn underline swatch:** a marker-stroke SVG/PNG in warm **orange/gold** (~`#F4A93B`–`#E8971F`), used under H1/H2 headings across marketing pages as a signature decorative device.

**Loader dots** (the branded "Hang tight, genius work in progress" spinner) uses 4 pastel dots — coral pink, mint green, lavender purple, pale yellow — echoing the IQ/EQ/SQ/YOU four-color system.

### 2.3 Storefront/app-layer palette (Graphy default, catalog + course pages)

| Swatch | Hex | Usage |
|---|---|---|
| Primary blue | `#317AE7` | Buy buttons, category filter button, price/link text, "View All" links |
| Pale blue bg | `#EFF5FE` | Theme background tint |
| Body text | `#50596C` | Default paragraph/course-meta text |
| Heading gray | `#494949` | H2/H3 on course detail pages |
| Muted gray | `#ACB3C2` | Secondary/disabled text |
| Light surfaces | `#F8F9FA`, `#F9F9F9`, `#F7F7F7`, `#FAF9F5` | Card/page backgrounds, alternating section fills |
| Success green | `#52C95A` | WhatsApp CTA, "Contact us" pill |
| Amber | `#FFC107` | Rating stars / highlight accents |
| Black | `#000000` | Pure black text in a few components (inconsistent with `#4D1435`/`#50596C` elsewhere — normalize this in your rebuild) |

### 2.4 Phase color-coding system

Courses are grouped into numbered "Phases" (Phase -1/Pre-Pregnancy, Phase 0/Pregnancy, Phase I–XI covering birth through age 15). Each phase's course-card header band uses its own pastel color (observed: pregnancy = warm orange/apricot gradient split card; infant phases = pale yellow; toddler/pre-school = pink/rose; middle-schooler = lavender/purple). The **badge itself** ("Phase 0", "Phase I", etc.) is always a small **white pill** sitting on the colored image band, with dark maroon/gray text — the badge is neutral; the *card band* carries the phase's color. Recommend formalizing this as a "phase palette" array of ~11 pastel hex values if you rebuild the catalog.

---

## 3. Typography

| Role | Font | Notes |
|---|---|---|
| Primary UI/body font | **Inter** (`Inter, sans-serif`) | Used almost everywhere — nav, body copy, buttons, cards, forms |
| Display/accent font | **"Poetsen One"** (`"Poetsen One", sans-serif`) | Rounded, bold, playful display face — used sparingly for special brand moments (spotted in KGKP Method page's decorative type). Google Font. |
| Fallback stack (utility framework remnants) | `ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"` and `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | Present from underlying component libraries (Tailwind/system defaults) — treat as noise, standardize on Inter |

### Type scale observed

| Element | Size | Weight | Color | Notes |
|---|---|---|---|---|
| Hero H1 (marketing) | 42px | 700 | `#4D1435` | e.g. "Unlock your Child's Intelligence" |
| Course detail H1 | 35px | 700 | `#FFFFFF` (on maroon banner) | Course title banner |
| Section H2 | 25px | 700 | `#494949` / `#4D1435` | "Overview", "The Kaushalya Genius Kid Program" |
| Sub-heading (IQ/EQ/SQ labels) | 24px | 600 | `#4D1435` | "IQ \| Intelligence quotient" style |
| H3 | 18px | 700 | `#494949` | Body sub-sections |
| Body copy | 16px | 400 | `#50596C` (app) / `#4D1435`-tinted (marketing) | Standard paragraph |
| Button label | 16px | 400–600 | white or maroon | 600 for the storefront blue "Buy now" button; 400 on most pill CTAs |
| Letter spacing | ~0.08px | — | — | Buttons only; body text uses `normal` |

Line-height/text-transform: no uppercase transforms observed; all sentence/title case, `normal` letter-spacing except the slight tracking on buttons.

---

## 4. Layout, Spacing & Elevation

### Radius scale (use this as your `--radius-*` tokens)

```
2px    – tag/label corners (rare)
4px    – small chips
5px    – small chips
6px    – small chips
10px   – form panels, small cards
12px   – standard cards (course cards, method cards, pillar cards)
25px   – buttons, inputs container ("--themeCornerRadius" — the site's own pill token)
40px   – large CTA pills
50px   – hero-scale CTA pills
50%    – avatar/circular icon containers
9999px/10000px – fully pill-shaped elements (WhatsApp button, badges)
```

### Shadow scale

```
sm:  0px 1px 4px rgba(69,77,93,0.30)        /* resting card */
md:  0px 4px 10px rgba(69,77,93,0.30)       /* hovered/elevated card */
fab: 0px 2px 8px rgba(0,0,0,0.25)           /* floating Call/WhatsApp buttons */
soft-glow: 0px 0px 74px rgba(5,30,80,0.10)  /* large ambient section shadow */
soft-glow-2: 0px 0px 41px #EEEEEE           /* card ambient halo */
warm-elevated: 0px 40px 80px rgba(217,119,87,0.24), 0px 4px 14px rgba(217,119,87,0.24)   /* hero image / featured card hover */
warm-inset: inset 0 0 15px rgba(217,119,87,0.70), inset 0 0 25px rgba(217,119,87,0.50), inset 0 0 35px rgba(217,119,87,0.20)  /* decorative inset glow */
```

### Structure

- Sticky header, fixed height **100px**, white background, logo left, centered/right nav, cart + auth control far right.
- Content max-width appears to be a standard centered container (~1200–1280px) with generous horizontal gutters.
- Section rhythm on marketing pages: alternating full-bleed color bands (white → coral → white → teal/mint → white → dark maroon → pale-yellow → coral footer), each section typically padded ~80–120px vertically.
- Course catalog: 3-column card grid (desktop), grouped into horizontal "Phase" rows, each with a "View All →" link top-right.
- Floating action buttons: "Call" (white pill, blue phone icon) and WhatsApp (green circle) stacked bottom-right, fixed position, visible on every page.

---

## 5. Components

### 5.1 Buttons

| Variant | Background | Text | Radius | Padding | Where used |
|---|---|---|---|---|---|
| Primary pill (brand) | `#4D1435` | white | 40–50px | 12–24px / 18–55px | Login, hero CTA "Find The Right Course", Submit, Request A Callback |
| Primary pill — hover/inverse | `#F6E2D7` peach fill, maroon border+text | `#4D1435` | 50px | same | Hover state of the hero CTA (border appears, fill lightens) |
| Inverse pill (on dark bg) | `#F6E2D7`/peach | `#4D1435` | 50px | 24px 55px | "Find The Right Course" on the dark maroon testimonial section |
| Storefront primary (Graphy blue) | `#317AE7` | white | 25px | 16px 20px | "Buy now for ₹X" on course detail pages |
| Category filter pill | `#317AE7` | white | pill | 8px 16px approx | Catalog category dropdown trigger |
| WhatsApp FAB | `#52C95A`-family green circle | white icon | 50% | — | Fixed bottom-right, all pages |
| Call FAB | white pill | blue icon + dark text | pill | — | Fixed bottom-right, above WhatsApp |
| "Launch your Graphy" footer badge | `#000000` | white | pill | 12px 24px | Storefront footer (Graphy's own attribution — remove/replace in your portal) |

All buttons: no visible `:focus` ring style was detected — **add one** for accessibility when you rebuild (the source site does not model this well).

### 5.2 Cards

**Course card (catalog grid):**
- White surface, ~12px radius, subtle `sm` shadow.
- Top: split layout — left 60% is a photo, right 40% is a phase-colored panel showing "{Nth} Month / {Age range}" + a small white "Phase N" pill badge bottom-right of the image.
- Below image: course title (dark, semibold, 2-line clamp), instructor name (gray, muted), price row = strikethrough original price (gray) + discounted price (blue `#317AE7`, bold).
- No visible border; separation is via shadow + white-space only.

**Method/pillar card (marketing):**
- Colored or teal top image block (rounded top corners only) + white bottom panel with centered caption text, OR fully-colored card (olive/peach/sky-blue) with white illustration area and dark title beneath.
- Radius ~12–16px on the whole card; consistent card height within a row.

**Stat card (counters):** icon on top (flat illustration), large bold number with a red/coral "+" suffix, caption below in gray. No visible card container — just centered stacked content in a grid.

### 5.3 Forms

- **No boxed inputs** — fields are borderless with a **bottom border-only underline** (`border-bottom: 1px solid #ddd`-ish), placeholder text in muted gray/maroon-tint, generous vertical spacing between fields (~40–48px).
- Demo/lead forms live inside a large rounded container (radius ~20–25px, thin border) or a colored panel (pale-yellow "Interested in the KGKP?" block).
- Submit buttons: maroon pill with a trailing arrow icon (`→`), consistent across every lead-gen form (Demo page, footer callback, home mid-page callback).
- Fields seen: Name, Mobile No., Email (optional), City (optional), Child's Age, "What brings you here?" — all single-line text, no visible validation styling captured.

### 5.4 Accordion (FAQ)

- Each Q&A is a separate white rounded-rectangle row (radius ~12px, thin `#eee` border, no shadow at rest).
- Row = question text (left) + chevron icon (right, `⌄`/`⌃` rotates on toggle).
- Expanded state reveals answer paragraph directly below the question inside the same row, chevron flips to point up.
- FAQ page also has: a coral "How can we help?" search band with a white pill search input + circular maroon search-icon button, and a row of category tabs with icon + label (active tab gets an underline in maroon) below it.

### 5.5 Navigation

- Logo: yellow sunburst icon + italic bold wordmark "KAUSHALYA GENIUS KID PROGRAM" (black text, "KID" highlighted in a small red badge/chip).
- Nav items (marketing, logged-out): Home · KGKP Method · Courses · FAQ · Demo, plus cart icon + maroon "Login →" pill.
- Nav items (app/logged-in): Home · KGKP Method · Courses · FAQ · **Dashboard**, plus cart icon + circular user-avatar with dropdown caret (replaces Login).
- Active link indicated by an orange/coral underline + color shift on the link text.

### 5.6 Footer

**Marketing footer:** full-bleed coral `#EF816C` band. Left: white rounded lead-capture card floating half-overlapping the section above it. Right: 4 link columns (Quick links / Resources / Channel Partners / Social Media) in dark maroon text, social icons as small white/dark circular glyphs, company registration address in small text, copyright line + policy links centered at the very bottom.

**Storefront footer (Graphy default):** plain white/light-gray band with a black "Launch your Graphy" pill, "100K+ creators trust Graphy" line, social icon row, and copyright + Privacy/Terms/Contact/Refund links — this is vendor boilerplate, not KGKP brand design; drop it entirely in your own portal.

### 5.7 Loading state

Branded full-screen loading overlay: background image blurred, 4 pastel dots (coral/mint/lavender/yellow) in a small cluster animation, white centered caption **"Hang tight, genius work in progress"**. Nice on-brand detail worth reusing verbatim or adapting.

---

## 6. Iconography & Illustration

- Icons: Google "Material Symbols"-style rounded icons for utilitarian UI (cart, menu, envelope, phone, chevrons, video/play).
- Illustrations: flat, colorful, rounded-corner "storybook" style — used heavily for hero art, method-pillar art, and section dividers (parents embracing, kids reading, brain/tree metaphors, growth-chart mockups). Consistent flat-vector illustration style throughout (likely a licensed illustration set, e.g. unDraw/Storyset-family).
- Decorative motifs: hand-drawn marker-stroke underlines (orange/gold) beneath headings; dashed doodle arrows and small stars/confetti scattered near hero art; numbered circular step-badges (1–4) in maroon-outlined white circles for the "4 stages" process section; a rooted-tree metaphor illustration mapping program stages to tree parts (roots = pre-pregnancy, trunk = pregnancy, branches = growth stages).

---

## 7. Page-by-Page Notes

- **Home (marketing):** Coral hero → white stats counters (animated count-up) → teal "KGKP Method" 3-pillar section → white "4 stages" process (teal bg, numbered peach cards) → white "Kaushalya Genius Kid Program" description + tree illustration → mint/teal pillar-program cards (olive/peach/sky-blue) → pale-yellow callback form → dark-maroon testimonial + YouTube embed → coral footer.
- **KGKP Method:** Peach hero "Learn How we Actualize the Genius of your Child" with hand-drawn underline → circular IQ/EQ/SQ badge diagram → teal 3-card "The KGKP Method" grid → alternating illustrated feature rows (Reading/Math/Encyclopaedic/Holistic, each with a colored numbered dot + heading + copy, paired with a YouTube "Watch on YouTube" embed card) → 4-stage age-based program cards (green podium illustrations + colored info cards: teal "Pre-pregnancy", purple "6–15 years", olive/peach/blue pillar cards) → Ridge Analysis brain-map graphic + benefit list (icon + heading + copy rows) → coral footer with callback form.
- **FAQ:** Title + hand-drawn underline → coral search band → icon tab row (General Info / Course Structure / Parental Involvement / Outcomes / Enrolment) → rounded accordion list, expandable.
- **Demo:** Simple centered white/bordered rounded panel with underline-style form fields (Name, Mobile, Email, City) + maroon "Submit →" pill; coral footer below.
- **Course Catalog (Graphy storefront):** Blue "Category ▾" filter pill → horizontal rows per Phase, each a 3-card grid, "View All" link per row; Graphy default footer.
- **Course Detail page:** Full-width maroon banner with white H1, short meta (creator, language), sticky/floating purchase card (thumbnail + price + "Buy now" blue pill + green "Contact us" pill) overlapping the banner; below, white "Overview" section, plain body copy.
- **Dashboard / Admin:** This is Graphy's own creator-admin console (green accent, left sidebar, generic SaaS UI) — not KGKP's design language. Excluded from tokens above.

---

## 8. Suggested Design Tokens for Your New Portal

Adapt/normalize rather than copy 1:1 — the source has some inconsistency (blue vs. maroon as "primary", inconsistent grays). Recommended consolidated token set:

```css
:root {
  /* Brand */
  --color-primary: #4D1435;       /* wine/maroon — pick ONE primary, recommend keeping brand maroon over Graphy's stock blue */
  --color-primary-contrast: #FFFFFF;
  --color-secondary: #EF816C;     /* coral */
  --color-accent-gold: #F4A93B;   /* underline swatches, highlights */

  /* Pastel supporting palette */
  --color-peach: #F6E2D7;
  --color-peach-mid: #F69B8A;
  --color-apricot: #F2B095;
  --color-yellow-pale: #FAEFB6;
  --color-lavender: #A696F7;
  --color-teal: #5FB6A6;
  --color-mint: #EDF7F5;
  --color-olive: #C3CA31;
  --color-sky: #A7DBF2;

  /* Neutrals */
  --color-text: #4D1435;          /* headings */
  --color-text-body: #50596C;     /* body copy */
  --color-text-muted: #ACB3C2;
  --color-surface: #FFFFFF;
  --color-surface-alt: #F8F9FA;
  --color-border: #EEEEEE;

  /* Status */
  --color-success: #52C95A;
  --color-warning: #FFC107;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 25px;   /* the site's own pill token */
  --radius-pill: 999px;

  /* Shadow */
  --shadow-sm: 0px 1px 4px rgba(69,77,93,0.30);
  --shadow-md: 0px 4px 10px rgba(69,77,93,0.30);
  --shadow-fab: 0px 2px 8px rgba(0,0,0,0.25);

  /* Type */
  --font-body: 'Inter', sans-serif;
  --font-display: 'Poetsen One', sans-serif;
  --header-height: 100px;
}
```

---

## 9. Recommendations When Building the New Portal

1. **Pick one primary action color.** The source mixes brand maroon (marketing pages) with Graphy's default blue (storefront). For a cohesive parent-facing portal, standardize on maroon `#4D1435` as primary with coral `#EF816C` as the secondary/CTA-alternate, and drop the Graphy blue entirely.
2. **Keep the pastel "phase" color-coding** — it's a genuinely useful wayfinding device (parents instantly recognize which age-band a course belongs to by its card color). Formalize it as a documented array of 11–12 hex values mapped to Phase −1 through Phase XI.
3. **Reuse the pill-button + underline-swatch + flat-illustration language** — these three devices carry most of the brand's warmth and are cheap to reproduce with plain CSS/SVG (no need to lift actual assets).
4. **Normalize typography** to Inter for everything, reserving "Poetsen One" (a free Google Font) for a handful of hero/display moments only — it currently appears underused/inconsistently on the live site.
5. **Add missing accessibility affordances**: visible focus states on buttons/inputs and adequate contrast checks — several pastel-on-white combinations (e.g. pale yellow panels with maroon text) should be re-checked against WCAG AA at your final sizes.
6. **Don't port the Graphy vendor chrome** ("Launch your Graphy" footer badge, the generic creator-admin dashboard) — none of it is KGKP's own brand and it will look out of place in a bespoke portal.
