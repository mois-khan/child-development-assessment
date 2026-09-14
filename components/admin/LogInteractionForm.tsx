"use client";

import { useState, type ReactNode } from "react";
import { adminLogInteraction, type InteractionChannel, type InteractionOutcome } from "@/lib/admin/leads";
import { todayISO } from "@/lib/age";
import {
  Button,
  Card,
  IconCalendar,
  IconCheck,
  IconDots,
  IconMail,
  IconMessage,
  IconPhone,
  IconUser,
  IconWhatsApp,
} from "@/components/ui";

/* ── shared label/icon maps ─────────────────────────────────────────────────
 * Used by the lead detail page's interaction history AND this form — one
 * source so a channel or outcome never reads differently in the two places
 * an admin sees it. */

export const OUTCOME_LABEL: Record<InteractionOutcome, string> = {
  interested: "Showed Interest",
  not_interested: "Not Interested",
  call_back: "Requested Call-Back",
  info_requested: "Requested More Info",
  payment_discussion: "Payment Discussion",
  assessment_discussion: "Assessment Discussion",
  converted: "Converted to Customer",
  no_response: "No Response",
  other: "Other",
};

export const CHANNEL_ICON: Record<InteractionChannel, ReactNode> = {
  phone: <IconPhone size={16} />,
  whatsapp: <IconWhatsApp size={16} />,
  email: <IconMail size={16} />,
  sms: <IconMessage size={16} />,
  in_person: <IconUser size={16} />,
  other: <IconDots size={16} />,
};

export const CHANNEL_LABEL: Record<InteractionChannel, string> = {
  phone: "Phone Call",
  whatsapp: "WhatsApp",
  email: "Email",
  sms: "SMS",
  in_person: "In Person",
  other: "Other",
};

/**
 * The quick "log an interaction" form — one card, reused on the lead detail
 * page (a sidebar panel there) and inside the leads list's per-card modal
 * (see AdminLeadsPage), so logging a call never requires opening the full
 * profile first.
 */
export function LogInteractionForm({
  leadId,
  loggedByUserId,
  onLogged,
  bare = false,
}: {
  leadId: string;
  loggedByUserId: string;
  onLogged: () => void;
  /** Skip the Card wrapper — the modal on the leads list already provides one. */
  bare?: boolean;
}) {
  const [channel, setChannel] = useState<InteractionChannel>("phone");
  const [outcome, setOutcome] = useState<InteractionOutcome>("interested");
  const [remarks, setRemarks] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [scheduleFollowUp, setScheduleFollowUp] = useState(false);
  const [saving, setSaving] = useState(false);

  // Follow-up date is ALWAYS optional — reset it if toggle is off
  function toggleFollowUp() {
    setScheduleFollowUp((s) => {
      if (s) setNextDate(""); // clear date when disabling
      return !s;
    });
  }

  async function save() {
    setSaving(true);
    try {
      await adminLogInteraction(leadId, {
        channel,
        outcome,
        remarks: remarks.trim(),
        loggedByUserId,
        nextFollowUpAt: scheduleFollowUp && nextDate ? nextDate : undefined,
      });
      setRemarks("");
      setNextDate("");
      setScheduleFollowUp(false);
      setOutcome("interested");
      onLogged();
    } finally {
      setSaving(false);
    }
  }

  const body = (
    <div className="mt-3.5 space-y-3">
      {/* Channel — icon-only, one row, so it never needs to wrap */}
      <div>
        <label className="label mb-1.5">Channel</label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.entries(CHANNEL_LABEL) as [InteractionChannel, string][]).map(([v, l]) => (
            <button
              key={v}
              type="button"
              title={l}
              aria-label={l}
              aria-pressed={channel === v}
              onClick={() => setChannel(v)}
              className={`grid size-9 shrink-0 place-items-center rounded-full transition-all ${
                channel === v
                  ? "bg-[var(--accent)] text-white shadow-md"
                  : "bg-surface-2 text-ink-3 hover:bg-surface-3 hover:text-ink"
              }`}
            >
              {CHANNEL_ICON[v]}
            </button>
          ))}
        </div>
      </div>

      {/* Outcome + follow-up date, side by side once there's room for both */}
      <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[1fr_auto]">
        <div>
          <label className="label mb-1.5">Outcome</label>
          <select
            className="field w-full"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as InteractionOutcome)}
          >
            {(Object.entries(OUTCOME_LABEL) as [InteractionOutcome, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col justify-end">
          {scheduleFollowUp ? (
            <input
              type="date"
              className="field w-full sm:!w-auto"
              value={nextDate}
              min={todayISO()}
              onChange={(e) => setNextDate(e.target.value)}
            />
          ) : (
            <button
              type="button"
              onClick={toggleFollowUp}
              className="btn btn-secondary btn-sm w-full justify-center whitespace-nowrap sm:w-auto"
            >
              <IconCalendar size={14} /> Follow-up
            </button>
          )}
        </div>
      </div>
      {scheduleFollowUp && (
        <button
          type="button"
          onClick={toggleFollowUp}
          className="-mt-2 text-xs font-semibold text-ink-3 hover:text-ink"
        >
          Cancel follow-up date
        </button>
      )}

      {/* Notes */}
      <div>
        <label className="label mb-1.5">Notes <span className="font-normal text-ink-3">(optional)</span></label>
        <textarea
          className="field w-full"
          rows={2}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="What was discussed?"
        />
      </div>

      {/* Save — always visible */}
      <Button
        onClick={save}
        disabled={saving}
        block
        iconLeft={saving ? undefined : <IconCheck size={15} />}
      >
        {saving ? "Saving…" : "Save Interaction Log"}
      </Button>
    </div>
  );

  if (bare) return body;

  return (
    <Card className="!p-5">
      <h2 className="!text-base font-bold text-ink">Log New Interaction</h2>
      <p className="mt-0.5 text-xs text-ink-3">
        Everything is optional except the outcome.
      </p>
      {body}
    </Card>
  );
}
