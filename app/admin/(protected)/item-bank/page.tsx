"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ADMIN_AGE_BANDS,
  ADMIN_DOMAINS,
  adminDeleteItem,
  adminListItems,
  adminRevertItem,
  adminSaveItem,
  type AdminItem,
  type ItemStatus,
} from "@/lib/admin/content";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { DomainCode, ItemSource } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  IconPlus,
  IconRefresh,
  domainColor,
  domainName,
} from "@/components/ui";

const SOURCES: ItemSource[] = ["CDC", "NIDCD", "WHO", "AUTHORED"];

const STATUS_BADGE: Record<ItemStatus, { label: string; tone: "neutral" | "accent" | "warn" | "success" } | null> = {
  base: null,
  edited: { label: "Edited", tone: "warn" },
  new: { label: "New", tone: "accent" },
  deleted: null,
};

export default function AdminItemBankPage() {
  const configured = isSupabaseConfigured();
  const [domain, setDomain] = useState<DomainCode>(ADMIN_DOMAINS[0].code);
  const [band, setBand] = useState<string>("");
  const [items, setItems] = useState<AdminItem[]>([]);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const bandsWithCounts = useMemo(() => {
    if (configured) return [];
    const all = adminListItems({ domain });
    return ADMIN_AGE_BANDS.map((b) => ({
      band: b,
      count: all.filter((i) => i.band === b.id).length,
    }));
  }, [domain, configured, refreshKey]);

  // A band picked explicitly, so the default view is one short list rather
  // than every age band's questions in one endless scroll.
  useEffect(() => {
    if (configured || bandsWithCounts.length === 0) return;
    setBand((current) => {
      if (current && bandsWithCounts.some((b) => b.band.id === current && b.count > 0)) {
        return current;
      }
      return bandsWithCounts.find((b) => b.count > 0)?.band.id ?? "";
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, configured]);

  useEffect(() => {
    if (configured) return;
    setItems(adminListItems({ domain, band: band || undefined }));
  }, [domain, band, configured, refreshKey]);

  function refresh() {
    setRefreshKey((k) => k + 1);
    setEditingId(null);
  }

  if (configured) {
    return (
      <div className="space-y-6">
        <h1 className="!text-[1.6rem]">Item bank</h1>
        <Card className="!p-8 text-center">
          <p className="text-[0.92rem] text-ink-3">
            Supabase-backed item bank editing isn't wired up yet — see lib/admin/content.ts.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="!text-[1.6rem]">Item bank</h1>
          <Badge tone="warn">Dev mode — edits save to this browser only</Badge>
        </div>
        <p className="mt-1.5 max-w-[62ch] text-[0.88rem] text-ink-3">
          The item bank, grouped by area and age band. Editing here doesn't touch{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.8rem]">content/items.ts</code>{" "}
          — it overlays your changes on top of it, saved to this browser, so you can try the editing
          workflow now. Not yet wired into the parent-facing assessment itself, or persisted anywhere
          but this browser — both land once Supabase is connected.
        </p>
      </div>

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
          <option value="">All age bands</option>
          {bandsWithCounts.map(({ band: b, count }) => (
            <option key={b.id} value={b.id} disabled={count === 0}>
              {b.label} ({count})
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
          Add item{!band ? " (pick a band first)" : ""}
        </Button>
      </div>

      {editingId === "new" && (
        <ItemForm
          domain={domain}
          band={band}
          onCancel={() => setEditingId(null)}
          onSaved={refresh}
        />
      )}

      {items.length === 0 ? (
        <Card className="!p-8 text-center">
          <p className="text-[0.9rem] text-ink-3">No items for this filter yet.</p>
        </Card>
      ) : band ? (
        <Card className="!p-0 overflow-hidden">
          <ItemList
            items={items}
            editingId={editingId}
            onEdit={setEditingId}
            onCancelEdit={() => setEditingId(null)}
            onSaved={refresh}
            onDelete={(id) => {
              adminDeleteItem(id);
              refresh();
            }}
            onRevert={(id) => {
              adminRevertItem(id);
              refresh();
            }}
          />
        </Card>
      ) : (
        // "All age bands" — one collapsible section per band instead of one
        // long scroll, so opening this view doesn't dump the whole domain
        // (up to ~100 items for the oldest module) onto the page at once.
        <div className="space-y-3">
          {bandsWithCounts
            .filter(({ count }) => count > 0)
            .map(({ band: b, count }) => (
              <details key={b.id} className="group card !p-0 overflow-hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5 select-none">
                  <span className="text-[0.92rem] font-bold text-ink">{b.label}</span>
                  <span className="flex items-center gap-2">
                    <Badge size="sm">{count}</Badge>
                    <span className="text-ink-3 transition-transform group-open:rotate-90">›</span>
                  </span>
                </summary>
                <div className="border-t border-line">
                  <ItemList
                    items={items.filter((i) => i.band === b.id)}
                    editingId={editingId}
                    onEdit={setEditingId}
                    onCancelEdit={() => setEditingId(null)}
                    onSaved={refresh}
                    onDelete={(id) => {
                      adminDeleteItem(id);
                      refresh();
                    }}
                    onRevert={(id) => {
                      adminRevertItem(id);
                      refresh();
                    }}
                  />
                </div>
              </details>
            ))}
        </div>
      )}
    </div>
  );
}

function ItemList({
  items,
  editingId,
  onEdit,
  onCancelEdit,
  onSaved,
  onDelete,
  onRevert,
}: {
  items: AdminItem[];
  editingId: string | "new" | null;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
  onSaved: () => void;
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
              band={item.band}
              existing={item}
              onCancel={onCancelEdit}
              onSaved={onSaved}
            />
          </div>
        ) : (
          <ItemRow
            key={item.id}
            item={item}
            onEdit={() => onEdit(item.id)}
            onDelete={() => onDelete(item.id)}
            onRevert={item.status !== "base" ? () => onRevert(item.id) : undefined}
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
        <p className="mt-1 text-[0.82rem] text-ink-3">{item.how}</p>
        <p className="mt-1 font-mono text-[0.72rem] text-ink-3">{item.id}</p>
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
        <Button size="sm" variant="ghost" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}

function ItemForm({
  domain,
  band,
  existing,
  onCancel,
  onSaved,
}: {
  domain: DomainCode;
  band: string;
  existing?: AdminItem;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [text, setText] = useState(existing?.text ?? "");
  const [how, setHow] = useState(existing?.how ?? "");
  const [source, setSource] = useState<ItemSource>(existing?.source ?? "AUTHORED");

  function save() {
    if (!text.trim() || !how.trim()) return;
    adminSaveItem({ id: existing?.id, domain, band, text: text.trim(), how: how.trim(), source });
    onSaved();
  }

  return (
    <Card variant="tint" tint="var(--accent)" className="!p-5">
      <div className="space-y-3">
        <div>
          <label className="label">Question text</label>
          <input className="field" value={text} onChange={(e) => setText(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="label">How to check</label>
          <textarea
            className="field"
            rows={2}
            value={how}
            onChange={(e) => setHow(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label">Source</label>
            <select className="field !w-auto" value={source} onChange={(e) => setSource(e.target.value as ItemSource)}>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={save}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
