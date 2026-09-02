"use client";

import { use, useEffect, useState } from "react";
import { DOMAINS, moduleForAge } from "@/content/domains";
import { itemsForModule } from "@/content/items";
import { formatAge, summariseAge, todayISO } from "@/lib/age";
import { getChild, type SavedChild } from "@/lib/store";
import {
  Badge,
  ButtonLink,
  Card,
  ChildCard,
  Footer,
  IconArrowRight,
  IconClock,
  IconLock,
  IconSparkle,
  Mascot,
  Section,
  SectionTile,
  Shell,
  TopBar,
  domainColor,
} from "@/components/ui";

export default function AssessmentListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [child, setChild] = useState<SavedChild | null | undefined>(undefined);

  useEffect(() => {
    setChild(getChild(id));
  }, [id]);

  if (child === undefined) {
    return (
      <>
        <TopBar />
        <Shell>
          <p className="pt-24 text-center font-semibold text-ink-3">Loading…</p>
        </Shell>
      </>
    );
  }
  if (child === null) {
    return (
      <>
        <TopBar />
        <Shell width="narrow">
          <div className="pt-20 text-center">
            <Mascot size={90} mood="think" className="mx-auto" />
            <h1 className="mt-6">We couldn&rsquo;t find that child</h1>
            <ButtonLink href="/children" className="mt-8">
              Go to your children
            </ButtonLink>
          </div>
        </Shell>
      </>
    );
  }

  const age = summariseAge(child.dob, todayISO(), child.gestationalWeeks);
  const mod = moduleForAge(age.assessedMonths);
  const perSection = DOMAINS.map((d) => ({
    code: d.code,
    name: d.name,
    count: itemsForModule(mod.id, d.code).length,
  }));
  const total = perSection.reduce((n, s) => n + s.count, 0);

  return (
    <>
      <TopBar />

      <main>
        <Section size="sm">
          <Shell width="wide">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="eyebrow eyebrow-accent">Step 1 of 2</p>
                <h1 className="mt-3">Choose a check</h1>
                <p className="lede mt-3 max-w-[44ch]">
                  Built for {child.name}&rsquo;s exact stage — Module {mod.id}, {mod.name}.
                </p>
              </div>
              <ChildCard
                name={child.name}
                photoUrl={child.photoUrl}
                ageLabel={`${formatAge(age.chronologicalMonths)} old`}
                dobLabel={new Date(`${child.dob}T00:00:00`).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              />
            </div>

            <div className="mt-9 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
              {/* the live one */}
              <Card variant="clay" className="clay-lg overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-4 p-6 sm:p-8">
                  <div>
                    <Badge tone="accent" size="lg">
                      <IconSparkle size={15} /> Recommended for this stage
                    </Badge>
                    <h2 className="mt-4">Genius Milestone Check</h2>
                    <p className="mt-2.5 max-w-[46ch] text-[0.96rem] leading-relaxed text-ink-2">
                      Six short sections, one for each area of brain development, at exactly the
                      level Module {mod.id} expects. One question at a time — most parents finish
                      in about ten minutes.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2.5">
                      <Badge tone="neutral">
                        <IconSparkle size={14} /> {total} questions
                      </Badge>
                      <Badge tone="neutral">
                        <IconClock size={14} /> ~10 min
                      </Badge>
                      <Badge tone="sun">₹99</Badge>
                    </div>
                  </div>
                  <Mascot size={78} mood="cheer" className="hidden sm:block" />
                </div>

                {/* what's inside */}
                <div className="border-t border-line-soft bg-[var(--surface-2)] p-6 sm:p-8">
                  <p className="eyebrow mb-4">What&rsquo;s inside</p>
                  <ul className="grid list-none gap-3 p-0 sm:grid-cols-2">
                    {perSection.map((s) => (
                      <li key={s.code} className="flex items-center gap-3">
                        <SectionTile code={s.code} size={38} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[0.9rem] font-bold text-ink">
                            {s.name}
                          </span>
                          <span
                            className="block text-[0.78rem] font-semibold"
                            style={{ color: domainColor(s.code) }}
                          >
                            {s.count} questions
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>

                  <ButtonLink
                    href={`/children/${child.id}/pay`}
                    size="lg"
                    block
                    className="mt-7"
                    iconRight={<IconArrowRight size={18} />}
                  >
                    Continue
                  </ButtonLink>
                </div>
              </Card>

              {/* the coming-soon shelf */}
              <div className="space-y-4">
                {[
                  {
                    title: "Ridge Analysis",
                    body: "Fingerprint-based talent profile — strengths, learning style, and the growth rate of every brain lobe.",
                  },
                  {
                    title: "Parent readiness check",
                    body: "A short check on the home environment and daily routine that surrounds your child's practice.",
                  },
                ].map((c) => (
                  <Card key={c.title} className="p-6 opacity-75">
                    <span className="grid size-11 place-items-center rounded-2xl bg-[var(--surface-3)] text-ink-3">
                      <IconLock size={20} />
                    </span>
                    <h3 className="mt-4">{c.title}</h3>
                    <p className="mt-2 text-[0.88rem] leading-relaxed text-ink-2">{c.body}</p>
                    <Badge className="mt-4">Coming soon</Badge>
                  </Card>
                ))}
              </div>
            </div>
          </Shell>
        </Section>
      </main>

      <Footer />
    </>
  );
}
