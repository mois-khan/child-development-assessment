import Image from "next/image";
import { DOMAINS, MODULES, MODULE_STAGES } from "@/content/domains";
import { ITEMS } from "@/content/items";
import { DISCLAIMER } from "@/lib/narrative";
import {
  Badge,
  Blooms,
  BrainJourney,
  Button,
  ButtonLink,
  Card,
  Disclaimer,
  Footer,
  IconArrowRight,
  IconBolt,
  IconCheck,
  IconClock,
  IconHeart,
  IconShield,
  IconSparkle,
  IconStarFilled,
  IconTrophy,
  IconUsers,
  Mascot,
  Section,
  SectionHeading,
  SectionTile,
  Shell,
  Stat,
  TopBar,
  domainColor,
} from "@/components/ui";

const TRUST = [
  { value: "10K+", label: "Children benefited", icon: <IconHeart size={20} /> },
  { value: "17+", label: "Years of KGK Program", icon: <IconTrophy size={20} /> },
  { value: "200K+", label: "Parents in workshops", icon: <IconUsers size={20} /> },
  { value: "42", label: "Milestones tracked", icon: <IconStarFilled size={20} /> },
];

const STEPS: {
  title: string;
  body: string;
  image: string;
  alt: string;
  tint: string;
}[] = [
  {
    title: "Add your child",
    body: "Name, birthday, a photo if you like. We work out their age and pick the exact module built for it — nothing you see will be irrelevant.",
    image: "/images/play-blocks.jpg",
    alt: "A baby playing with wooden blocks",
    tint: "var(--sec-manual)",
  },
  {
    title: "Answer what you see today",
    body: "Short, friendly questions — one at a time, each with a simple way to check together. Around ten minutes, and you can stop and come back.",
    image: "/images/parent-reading.jpg",
    alt: "A parent reading a book with their child",
    tint: "var(--sec-language)",
  },
  {
    title: "Get a report you keep",
    body: "Clear progress bars across all six areas, a plain-language summary, videos to watch together, and the next course to take.",
    image: "/images/outdoor-play.jpg",
    alt: "A child playing outdoors in autumn leaves",
    tint: "var(--sec-visual)",
  },
];

export default function Home() {
  return (
    <>
      <TopBar
        right={
          <ButtonLink href="/children" size="sm" iconRight={<IconArrowRight size={16} />}>
            Get started
          </ButtonLink>
        }
      />

      <main>
        {/* ══ hero ═════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden">
          <Blooms />
          <Shell width="full" className="relative">
            <div className="grid items-center gap-12 pb-8 pt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-20 lg:pt-20">
              <div>
                <span className="animate-rise inline-flex items-center gap-2 rounded-full border border-[var(--accent-line)] bg-[var(--surface)] px-4 py-2 text-[0.8rem] font-bold text-accent shadow-[var(--clay-sm)]">
                  <IconSparkle size={16} />
                  Ages 0–6 · 7 modules · 6 areas
                </span>

                <h1
                  className="display animate-rise mt-6"
                  style={{ animationDelay: "60ms" }}
                >
                  Every child is born a genius.
                  <br />
                  <span style={{ color: "var(--accent)" }}>Let&rsquo;s find theirs.</span>
                </h1>

                <p
                  className="lede animate-rise mt-6 max-w-[52ch]"
                  style={{ animationDelay: "120ms" }}
                >
                  A ten-minute milestone check across the six areas of your child&rsquo;s brain
                  development — with a keepsake report, videos, and the exact next step for
                  the stage they&rsquo;re in right now.
                </p>

                <div
                  className="animate-rise mt-9 flex flex-wrap items-center gap-3"
                  style={{ animationDelay: "180ms" }}
                >
                  <ButtonLink href="/children" size="lg" iconRight={<IconArrowRight size={18} />}>
                    Start the check
                  </ButtonLink>
                  <ButtonLink href="#how" variant="secondary" size="lg">
                    See how it works
                  </ButtonLink>
                </div>

                <ul
                  className="animate-rise mt-8 flex list-none flex-wrap items-center gap-x-6 gap-y-2 p-0 text-[0.88rem] font-semibold text-ink-2"
                  style={{ animationDelay: "240ms" }}
                >
                  {[
                    { icon: <IconClock size={17} />, text: "About 10 minutes" },
                    { icon: <IconShield size={17} />, text: "Private to your device" },
                    { icon: <IconBolt size={17} />, text: "Instant report" },
                  ].map((f) => (
                    <li key={f.text} className="flex items-center gap-2">
                      <span className="text-accent">{f.icon}</span>
                      {f.text}
                    </li>
                  ))}
                </ul>
              </div>

              {/* photo collage */}
              <div className="animate-rise relative" style={{ animationDelay: "140ms" }}>
                <div className="relative mx-auto aspect-[4/3.4] w-full max-w-[560px]">
                  <div
                    className="clay clay-lg photo-frame absolute left-0 top-4 w-[62%] overflow-hidden"
                    style={{ borderRadius: "var(--radius-xl)" }}
                  >
                    <Image
                      src="/images/hero-parent-child.jpg"
                      alt="A parent lifting their laughing baby in a sunny park"
                      width={700}
                      height={466}
                      priority
                      className="h-full w-full object-cover"
                      style={{ aspectRatio: "4/3.2" }}
                    />
                  </div>

                  <div
                    className="clay clay-lg photo-frame absolute bottom-2 right-0 w-[52%] overflow-hidden"
                    style={{ borderRadius: "var(--radius-xl)" }}
                  >
                    <Image
                      src="/images/joy-toddler.jpg"
                      alt="A laughing toddler"
                      width={560}
                      height={560}
                      className="h-full w-full object-cover"
                      style={{ aspectRatio: "1/1" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Shell>
        </div>

        {/* ══ trust strip ══════════════════════════════════════════════════ */}
        <Shell width="wide">
          <Card variant="clay" className="grid grid-cols-2 gap-6 px-6 py-8 sm:px-10 lg:grid-cols-4">
            {TRUST.map((t) => (
              <Stat key={t.label} value={t.value} label={t.label} icon={t.icon} />
            ))}
          </Card>
        </Shell>

        {/* ══ the six areas ════════════════════════════════════════════════ */}
        <Section id="areas">
          <Shell width="wide">
            <SectionHeading
              eyebrow="What we look at"
              title="Six areas, checked one by one"
              description="The same six competences the Kaushalya programme is built around. Each one gets its own short set of questions, chosen for your child's stage."
              align="center"
            />

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {DOMAINS.map((d, i) => (
                <Card
                  key={d.code}
                  variant="tint"
                  tint={domainColor(d.code)}
                  className="lift animate-rise p-6"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <SectionTile code={d.code} size={54} />
                  <h3 className="mt-4">{d.name}</h3>
                  <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-2">{d.blurb}</p>
                </Card>
              ))}
            </div>
          </Shell>
        </Section>

        {/* ══ the seven stages diagram ═════════════════════════════════════ */}
        <Section className="bg-[var(--surface)]" size="lg">
          <Shell width="wide">
            <SectionHeading
              eyebrow="The KGKP method"
              title="Seven stages of brain development"
              description="Your child climbs one stage at a time, from the newborn reflexes of the medulla to the sophisticated cortex of a six-year-old. We find the stage they are on today, then check all six areas at exactly that level."
              align="center"
            />

            {/* Full width, because the diagram is the point of this section —
                squeezed into a half-column its labels stop being readable. */}
            <Card variant="clay" className="mt-11 p-5 sm:p-8">
              <div className="overflow-x-auto">
                <BrainJourney
                  stages={MODULE_STAGES}
                  current={4}
                  className="h-auto w-full min-w-[720px]"
                />
              </div>
              <p className="mt-3 text-center text-[0.86rem] font-semibold text-ink-3">
                Example: a 9-month-old sits on stage 4, Initial Cortex
              </p>
            </Card>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-2.5">
              {MODULES.map((m) => (
                <Badge key={m.id} tone="neutral">
                  {m.phase} · {m.name}
                </Badge>
              ))}
            </div>

            <div className="mt-9 text-center">
              <ButtonLink
                href="/children"
                variant="secondary"
                iconRight={<IconArrowRight size={17} />}
              >
                Find your child&rsquo;s stage
              </ButtonLink>
            </div>
          </Shell>
        </Section>

        {/* ══ how it works ═════════════════════════════════════════════════ */}
        <Section id="how" size="lg">
          <Shell width="wide">
            <SectionHeading
              eyebrow="How it works"
              title="Three steps, one calm evening"
              align="center"
            />

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {STEPS.map((s, i) => (
                <Card
                  key={s.title}
                  variant="clay"
                  className="lift animate-rise overflow-hidden"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="photo-frame relative h-52 w-full overflow-hidden">
                    <Image
                      src={s.image}
                      alt={s.alt}
                      width={640}
                      height={420}
                      className="h-full w-full object-cover"
                    />
                    <span
                      className="absolute left-4 top-4 grid size-11 place-items-center rounded-2xl text-[1.05rem] font-extrabold text-white shadow-[var(--clay)]"
                      style={{ background: s.tint, fontFamily: "var(--font-display)" }}
                    >
                      {i + 1}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3>{s.title}</h3>
                    <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-2">{s.body}</p>
                  </div>
                </Card>
              ))}
            </div>
          </Shell>
        </Section>

        {/* ══ what you get ═════════════════════════════════════════════════ */}
        <Section className="bg-[var(--surface)]">
          <Shell width="wide">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <div
                  className="clay clay-lg photo-frame relative overflow-hidden"
                  style={{ borderRadius: "var(--radius-xl)" }}
                >
                  <Image
                    src="/images/playful-child.jpg"
                    alt="A smiling child playing happily indoors"
                    width={860}
                    height={574}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="mt-4 flex items-center gap-3 px-1">
                  <div className="min-w-0 flex-1">
                    <p className="eyebrow">Language competence</p>
                    <div className="mt-2 meter-track">
                      <div
                        className="meter-fill grow-in"
                        style={{ width: "78%", background: "var(--sec-language)" }}
                      />
                    </div>
                  </div>
                  <span className="tnum text-[1.05rem] font-extrabold text-ink">78</span>
                </div>
              </div>

              <div>
                <SectionHeading
                  eyebrow="The report"
                  title="A keepsake, not a verdict"
                  description="Every check ends with a report written in plain language — no jargon, no scores you have to decode. It lives on your child's profile so you can open or download it any time."
                />
                <ul className="mt-7 list-none space-y-3.5 p-0">
                  {[
                    "Progress bars for all six areas, at a glance",
                    "A short, kind summary of where they are",
                    "Videos to watch together where practice would help",
                    "The exact Kaushalya course for their stage",
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[var(--st-on-track-soft)] text-[var(--st-on-track)]">
                        <IconCheck size={14} />
                      </span>
                      <span className="text-[0.96rem] font-medium leading-relaxed text-ink-2">
                        {line}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Shell>
        </Section>

        {/* ══ closing CTA ══════════════════════════════════════════════════ */}
        <Section size="lg">
          <Shell width="wide">
            <div
              className="relative overflow-hidden px-6 py-14 text-center sm:px-12"
              style={{
                borderRadius: "var(--radius-xl)",
                background: "linear-gradient(150deg, var(--brand-600), var(--brand-800))",
                boxShadow:
                  "0 2px 5px rgba(69, 77, 93, 0.14), 0 40px 70px -28px color-mix(in srgb, var(--brand-600) 65%, transparent)",
              }}
            >
              <span
                aria-hidden="true"
                className="bloom"
                style={{ width: 320, height: 320, top: -140, left: "10%", "--bloom-color": "var(--brand-400)", opacity: 0.4 } as React.CSSProperties}
              />

              <div className="relative">
                <Mascot size={78} mood="wave" className="mx-auto" />
                <h2 className="mt-5 text-white">Ready when you are.</h2>
                <p className="mx-auto mt-3 max-w-[46ch] text-[1rem] leading-relaxed text-white/80">
                  Find a calm ten minutes with your child nearby — some questions ask you to
                  try something fun together.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <ButtonLink href="/children" variant="sun" size="lg" iconRight={<IconArrowRight size={18} />}>
                    Start for ₹99
                  </ButtonLink>
                  <span className="text-[0.85rem] font-semibold text-white/70">
                    Free during launch with code GENIUS99
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <Disclaimer text={DISCLAIMER} />
              <p className="mt-4 text-center text-[0.76rem] leading-relaxed text-ink-3">
                Built on a bank of {ITEMS.length} milestones drawn from the CDC&rsquo;s{" "}
                <em>Learn the Signs. Act Early.</em> checklists, the NIDCD hearing and
                communication checklist, and WHO motor milestone data.
              </p>
            </div>
          </Shell>
        </Section>
      </main>

      <Footer />
    </>
  );
}
