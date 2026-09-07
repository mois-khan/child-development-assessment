"use client";

import { useCallback, useState } from "react";
import { IconCheck, IconClose } from "./icons";

export interface BannerMessage {
  tone: "success" | "error";
  text: string;
}

/**
 * Replaces window.alert() for admin CMS save/delete/invite feedback — a
 * blocking browser dialog is a jarring, dated pattern next to the rest of
 * this app's UI. Success messages clear themselves; errors stay until the
 * next action or an explicit dismiss, since they usually need to be read
 * and acted on rather than glanced at.
 */
export function useBanner() {
  const [message, setMessage] = useState<BannerMessage | null>(null);

  const showSuccess = useCallback((text: string) => {
    setMessage({ tone: "success", text });
    window.setTimeout(() => setMessage((m) => (m?.text === text ? null : m)), 3000);
  }, []);

  const showError = useCallback((text: string) => {
    setMessage({ tone: "error", text });
  }, []);

  const clear = useCallback(() => setMessage(null), []);

  return { message, showSuccess, showError, clear };
}

export function InlineBanner({
  message,
  onDismiss,
}: {
  message: BannerMessage | null;
  onDismiss: () => void;
}) {
  if (!message) return null;
  const isSuccess = message.tone === "success";

  return (
    <div
      className="mb-5 flex items-center justify-between gap-3 rounded-[var(--radius)] border px-4 py-3 text-sm font-semibold"
      style={{
        borderColor: isSuccess ? "var(--st-on-track-soft)" : "var(--st-consult-soft)",
        background: isSuccess ? "var(--st-on-track-soft)" : "var(--st-consult-soft)",
        color: isSuccess ? "var(--st-on-track-ink)" : "var(--st-consult-ink)",
      }}
    >
      <span className="flex items-center gap-2">
        {isSuccess && <IconCheck size={15} />}
        {message.text}
      </span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 opacity-70 hover:opacity-100"
      >
        <IconClose size={15} />
      </button>
    </div>
  );
}
