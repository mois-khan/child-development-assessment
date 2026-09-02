import Link from "next/link";
import { DOMAINS } from "@/content/domains";
import { ITEMS } from "@/content/items";
import { DISCLAIMER } from "@/lib/narrative";
import {
  Disclaimer,
  SectionLabel,
  Shell,
  Tick,
  TopBar,
  domainColor,
} from "@/components/ui";

const STEPS: [string, string][] = [
  [
    "Add your child",
    "Just their name, birthday and gender. We use that to pick the right questions for their age.",
  ],
  [
    "Answer what you see today",
    "Every question comes with a simple way to check, so you can try it rather than guess. “Not yet” is a useful answer, not a bad one.",
  ],
  [
    "Get a fun, easy-to-read report",
    "Where your child is strong, where they'd love a little more practice, and fun videos and activities to try together.",
  ],
];

const CARDS: [string, string, "blue" | "green" | "pink"][] = [
  [
    "Six fun areas to explore",
    "Visual, auditory, tactile, mobility, language and manual skills — checked with simple, playful questions.",
    "blue",
  ],
  [
    "Grows with your child",
    "The right module is chosen automatically for their age, from newborn all the way to six years old.",
    "green",
  ],
  [
    "A report to keep",
    "Clear progress bars, a friendly summary, and videos to watch together — saved on their profile for good.",
    "pink",
  ],
];

export default function Home() {
  return (
    <>
      <TopBar
        bordered={false}
        right={
          <Link href="/children" className="btn btn-primary btn-sm">
            Get started
          </Link>
        }
      />

      <main className="pb-24">
        <Shell>
          {/* ── hero ──────────────────────────────────────────────────── */}
          <section className="pt-12 sm:pt-20">
            <p className="eyebrow eyebrow-accent animate-rise">
              Kaushalya Genius Kid Program · Ages 0–6
            </p>

            <h1
              className="display animate-rise mt-5"
              style={{ animationDelay: "60ms" }}
            >
              Every child is born a genius —{" "}
              <span style={{ color: "var(--accent)" }}>let&rsquo;s find theirs.</span>
            </h1>

            <p
              className="lede animate-rise mt-6 max-w-[46ch]"
              style={{ animationDelay: "120ms" }}
            >
              A short, playful check-up for how your child is growing. Answer a
              few simple questions, and get a clear, friendly report with fun
              things to try together at home.
            </p>

            <div
              className="animate-rise mt-9 flex flex-wrap items-center gap-x-4 gap-y-3"
              style={{ animationDelay: "180ms" }}
            >
              <Link href="/children" className="btn btn-primary">
                Start with your child
              </Link>
              <ul className="flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0 text-[0.85rem] text-ink-3">
                {["About 10 minutes", "Fun for kids", "Just ₹99"].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <Tick size={14} animate={false} color="var(--accent)" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ── playful feature cards ────────────────────────────────── */}
          <section className="mt-16">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {CARDS.map(([title, body, color]) => (
                <div key={title} className={`card-pastel card-pastel-${color}`}>
                  <h3 className="text-[1.02rem]">{title}</h3>
                  <p className="mt-2 text-[0.87rem] leading-relaxed text-ink-2">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── the six areas ─────────────────────────────────────────── */}
          <section className="mt-20">
            <SectionLabel>The six areas we look at</SectionLabel>
            <ul className="mt-6 grid list-none grid-cols-1 gap-x-8 gap-y-6 p-0 sm:grid-cols-2">
              {DOMAINS.map((d) => (
                <li key={d.code} className="border-t border-line pt-4">
                  <span
                    aria-hidden="true"
                    className="mb-3 block h-[3px] w-8 rounded-full"
                    style={{ background: domainColor(d.code) }}
                  />
                  <h3 className="text-[1.02rem]">{d.name}</h3>
                  <p className="mt-1.5 text-[0.88rem] leading-relaxed text-ink-2">
                    {d.blurb}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* ── how it works ──────────────────────────────────────────── */}
          <section className="mt-20">
            <SectionLabel>How it works</SectionLabel>
            <ol className="mt-6 list-none space-y-7 p-0">
              {STEPS.map(([title, body], i) => (
                <li key={title} className="grid grid-cols-[1.9rem_1fr] gap-4">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 text-[0.95rem] font-bold tabular-nums text-accent"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-[1.02rem]">{title}</h3>
                    <p className="mt-1.5 max-w-[54ch] text-[0.9rem] leading-relaxed text-ink-2">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* ── close ─────────────────────────────────────────────────── */}
          <section className="mt-20">
            <div className="card-pastel card-pastel-blue text-center">
              <h2 className="text-[1.3rem]">Ready when you are.</h2>
              <p className="mx-auto mt-2 max-w-[40ch] text-[0.92rem] leading-relaxed text-ink-2">
                Find a calm ten minutes with your child nearby — some questions
                ask you to try something fun together.
              </p>
              <Link href="/children" className="btn btn-primary mt-6">
                Start with your child
              </Link>
            </div>
          </section>

          <section className="mt-12">
            <Disclaimer text={DISCLAIMER} />
            <p className="mt-4 text-[0.74rem] leading-relaxed text-ink-3">
              Built on a bank of {ITEMS.length} milestones drawn from the
              CDC&rsquo;s <em>Learn the Signs. Act Early.</em> checklists, the
              NIDCD hearing and communication checklist, and WHO motor milestone
              data.
            </p>
          </section>
        </Shell>
      </main>
    </>
  );
}
