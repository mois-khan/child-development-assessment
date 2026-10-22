"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button, Card } from "@/components/ui/primitives";
import { IconClose, IconSignOut } from "@/components/ui/icons";

export interface SignOutConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
}

/**
 * SignOutConfirmDialog
 *
 * Prompts the user to confirm before ending their authenticated session.
 * Rendered through a portal into document.body to avoid stacking context
 * or backdrop-filter clipping from parent containers.
 */
export function SignOutConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Sign out?",
  description = "Are you sure you want to sign out? You will need to sign in again to access your account.",
  confirmLabel = "Sign out",
  cancelLabel = "Cancel",
  busy = false,
}: SignOutConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);

    const previousBody = document.body.style.overflow;
    const previousHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousBody;
      document.documentElement.style.overflow = previousHtml;
    };
  }, [isOpen, busy, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signout-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <Card variant="clay" className="w-full max-w-sm !p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: "var(--st-consult-soft)",
              color: "var(--st-consult)",
            }}
          >
            <IconSignOut size={22} />
          </div>
          <button
            type="button"
            className="rounded-lg p-1 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-50"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
          >
            <IconClose size={20} />
          </button>
        </div>

        <h2 id="signout-dialog-title" className="mt-4 text-lg font-bold text-ink">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          {description}
        </p>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={busy}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onConfirm}
            disabled={busy}
            style={{
              background: "var(--st-consult)",
              color: "#fff",
            }}
          >
            {busy ? "Signing out…" : confirmLabel}
          </Button>
        </div>
      </Card>
    </div>,
    document.body,
  );
}
