"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ADMIN_STAGES,
  ADMIN_DOMAINS,
  adminDeleteItem,
  adminListItems,
  adminRevertItem,
  adminSaveItem,
  itemBankReady,
  overlayCount,
  primeItemBank,
  type AdminItem,
  type ItemStatus,
} from "@/lib/admin/content";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { DomainCode, ItemSource } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  ConfirmDeleteButton,
  IconPlus,
  IconRefresh,
  InlineBanner,
  domainColor,
  domainName,
} from "@/components/ui";

const SOURCES: ItemSource[] = ["ACE", "AUTHORED"];

const STATUS_BADGE: Record<ItemStatus, { label: string; tone: "neutral" | "accent" | "warn" | "success" } | null> = {
  base: null,
  edited: { label: "Edited", tone: "warn" },
  new: { label: "New", tone: "accent" },
  deleted: null,
};

export default function AdminQuestionBankPage() {
  const shared = isSupabaseConfigured();
  const [domain, setDomain] = useState<DomainCode>(ADMIN_DOMAINS[0].code);
  const [band, setBand] = useState<string>("");
  const [items, setItems] = useState<AdminItem[]>([]);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [ready, setReady] = useState(itemBankReady());
  const [error, setError] = useState<string | null>(null);

  // One fetch of the overlay, then every read below is synchronous. Nothing
  // renders against a half-loaded bank — a list that silently changes under
  // the admin between paint and fetch is worse than a moment of "Loading".
  useEffect(() => {
    let active = true;
    primeItemBank({ force: true })
      .catch((e: Error) => active && setError(e.message))
      .finally(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, []);

  const stagesWithCounts = useMemo(() => {
    if (!ready) return [];
    const all = adminListItems({ domain });
    return ADMIN_STAGES.map((b) => ({
      band: b,
      count: all.filter((i) => i.stage === b.id).length,
    }));
    // refreshKey is the invalidation signal — adminListItems reads a module cache
    // rather than props, so React has no other way to know the answer changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, ready, refreshKey]);

  // A band picked explicitly, so the default view is one short list rather
  // than every stage's questions in one endless scroll.
  useEffect(() => {
    if (!ready || stagesWithCounts.length === 0) return;
    setBand((current) => {
      if (current && stagesWithCounts.some((b) => b.band.id === current && b.count > 0)) {
        return current;
      }
      return stagesWithCounts.find((b) => b.count > 0)?.band.id ?? "";
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, ready]);

  useEffect(() => {
    if (!ready) return;
    setItems(adminListItems({ domain, stage: band || undefined }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, band, ready, refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    setEditingId(null);
  }, []);

  /** Every write goes through here so one place owns the error message. */
  const run = useCallback(
    async (work: () => Promise<void>) => {
      setError(null);
      try {
        await work();
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "That didn't save. Try again.");
        // Rethrown so the form that called this can clear its own saving
        // state — a button stuck on "Saving…" after a failed write leaves the
        // admin with no way to try again.
        throw e;
      }
    },
    [refresh],
  );

  const changed = ready ? overlayCount() : 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="!text-2xl">Question bank</h1>
          {ready && (
            <Badge tone={shared ? "success" : "warn"}>
              {shared
                ? changed === 0
                  ? "Live · no changes yet"
                  : `Live · ${changed} question${changed === 1 ? "" : "s"} changed`
                : "Dev mode — edits save to this browser only"}
            </Badge>
          )}
        </div>
        <p className="mt-1.5 max-w-[62ch] text-sm text-ink-3">
          Editing here doesn&rsquo;t touch{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">content/items.ts</code> — your
          changes are stored as a layer on top of it, so &ldquo;Revert&rdquo; always restores the
          booklet&rsquo;s own wording.{" "}
          {shared
            ? "A saved edit is live for every parent immediately, on every device."
            : "Without Supabase credentials these stay in this browser and are not shared."}
        </p>
      </div>

      <InlineBanner
        message={error ? { tone: "error", text: error } : null}
        onDismiss={() => setError(null)}
      />

      <div className="flex flex-wrap gap-2">
        {ADMIN_DOMAINS.map((d) => (
          <button
            key={d.code}
            type="button"
            onClick={() => {
              setDomain(d.code);
              setEditingId(null);
            }}
            className="chip cursor-pointer"
            style={
              domain === d.code
                ? ({ "--chip-bg": domainColor(d.code), "--chip-fg": "#fff", "--chip-bd": "transparent" } as React.CSSProperties)
                : ({ "--chip-bg": "var(--surface-2)", "--chip-fg": "var(--ink-2)", "--chip-bd": "transparent" } as React.CSSProperties)
            }
          >
            {domainName(d.code)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          className="field !w-auto"
          value={band}
          onChange={(e) => {
            setBand(e.target.value);
            setEditingId(null);
          }}
        >
          <option value="">All phases</option>
          {stagesWithCounts.map(({ band: b, count }) => (
            <option key={b.id} value={b.id} disabled={count === 0}>
              {b.roman} · {b.name} ({count})
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="secondary"
          iconLeft={<IconPlus size={16} />}
          onClick={() => setEditingId("new")}
          disabled={!band}
        >
          Add question{!band ? " (pick a phase first)" : ""}
        </Button>
      </div>

      {!ready ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-3" />
          ))}
        </div>
      ) : (
        <>
          {editingId === "new" && (
            <ItemForm
              domain={domain}
              stage={band}
              onCancel={() => setEditingId(null)}
              onSave={(input) => run(() => adminSaveItem(input))}
            />
          )}

          {items.length === 0 ? (
            <Card className="!p-8 text-center">
              <p className="text-sm text-ink-3">No questions for this filter yet.</p>
            </Card>
          ) : band ? (
            <Card className="!p-0 overflow-hidden">
              <ItemList
                items={items}
                editingId={editingId}
                onEdit={setEditingId}
                onCancelEdit={() => setEditingId(null)}
                onSave={(input) => run(() => adminSaveItem(input))}
                onDelete={(id) => void run(() => adminDeleteItem(id)).catch(() => {})}
                onRevert={(id) => void run(() => adminRevertItem(id)).catch(() => {})}
              />
            </Card>
          ) : (
            // "All phases" — one collapsible section per stage instead of one
            // long scroll, so opening this view doesn't dump the whole domain
            // (up to ~100 items for the oldest module) onto the page at once.
            <div className="space-y-3">
              {stagesWithCounts
                .filter(({ count }) => count > 0)
                .map(({ band: b, count }) => (
                  <details key={b.id} className="group card !p-0 overflow-hidden">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5 select-none">
                      <span className="text-sm font-bold text-ink">
                        {b.roman} · {b.name}
                      </span>
                      <span className="flex items-center gap-2">
                        <Badge size="sm">{count}</Badge>
                        <span className="text-ink-3 transition-transform group-open:rotate-90">›</span>
                      </span>
                    </summary>
                    <div className="border-t border-line">
                      <ItemList
                        items={items.filter((i) => i.stage === b.id)}
                        editingId={editingId}
                        onEdit={setEditingId}
                        onCancelEdit={() => setEditingId(null)}
                        onSave={(input) => run(() => adminSaveItem(input))}
                        onDelete={(id) => void run(() => adminDeleteItem(id)).catch(() => {})}
                        onRevert={(id) => void run(() => adminRevertItem(id)).catch(() => {})}
                      />
                    </div>
                  </details>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

type SaveHandler = (input: Parameters<typeof adminSaveItem>[0]) => Promise<void>;

function ItemList({
  items,
  editingId,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onRevert,
}: {
  items: AdminItem[];
  editingId: string | "new" | null;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
  onSave: SaveHandler;
  onDelete: (id: string) => void;
  onRevert: (id: string) => void;
}) {
  return (
    <div className="divide-y divide-line">
      {items.map((item) =>
        editingId === item.id ? (
          <div key={item.id} className="p-5">
            <ItemForm
              domain={item.domain}
              stage={item.stage}
              existing={item}
              onCancel={onCancelEdit}
              onSave={onSave}
            />
          </div>
        ) : (
          <ItemRow
            key={item.id}
            item={item}
            onEdit={() => onEdit(item.id)}
            onDelete={() => onDelete(item.id)}
            onRevert={item.status === "edited" ? () => onRevert(item.id) : undefined}
          />
        ),
      )}
    </div>
  );
}

function ItemRow({
  item,
  onEdit,
  onDelete,
  onRevert,
}: {
  item: AdminItem;
  onEdit: () => void;
  onDelete: () => void;
  onRevert?: () => void;
}) {
  const badge = STATUS_BADGE[item.status];
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-ink">{item.text}</p>
          {badge && <Badge tone={badge.tone} size="sm">{badge.label}</Badge>}
          <Badge size="sm">{item.source}</Badge>
        </div>
        <p className="mt-1 text-sm text-ink-3">{item.how}</p>
        <p className="mt-1 font-mono text-xs text-ink-3">{item.id}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" variant="ghost" onClick={onEdit}>
          Edit
        </Button>
        {onRevert && (
          <Button size="sm" variant="ghost" iconLeft={<IconRefresh size={14} />} onClick={onRevert}>
            Revert
          </Button>
        )}
        <ConfirmDeleteButton onConfirm={onDelete} />
      </div>
    </div>
  );
}

function ItemForm({
  domain,
  stage,
  existing,
  onCancel,
  onSave,
}: {
  domain: DomainCode;
  stage: string;
  existing?: AdminItem;
  onCancel: () => void;
  onSave: SaveHandler;
}) {
  const [text, setText] = useState(existing?.text ?? "");
  const [how, setHow] = useState(existing?.how ?? "");
  const [source, setSource] = useState<ItemSource>(existing?.source ?? "AUTHORED");
  const [saving, setSaving] = useState(false);

  const valid = text.trim().length > 0 && how.trim().length > 0;

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await onSave({
        id: existing?.id,
        domain,
        stage,
        text: text.trim(),
        how: how.trim(),
        kind: existing?.kind ?? "yesno",
        source,
        invert: existing?.invert,
        minAgeMonths: existing?.minAgeMonths,
      });
    } catch {
      // The page above already showed the message; just let the admin retry.
      setSaving(false);
    }
  }

  return (
    <Card variant="tint" tint="var(--accent)" className="!p-5">
      <div className="space-y-3">
        <div>
          <label className="label" htmlFor="item-text">
            Question text
          </label>
          <input
            id="item-text"
            className="field"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label className="label" htmlFor="item-how">
            How to check
          </label>
          <textarea
            id="item-how"
            className="field"
            rows={2}
            value={how}
            onChange={(e) => setHow(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label" htmlFor="item-source">
              Source
            </label>
            <select
              id="item-source"
              className="field !w-auto"
              value={source}
              onChange={(e) => setSource(e.target.value as ItemSource)}
            >
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={!valid || saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
