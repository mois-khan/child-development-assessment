"use client";

import { useEffect, useState } from "react";
import { Button } from "./primitives";

/**
 * A delete button that arms rather than fires.
 *
 * Every admin list (items, activities, videos, courses, rules) used to call
 * its delete handler on the first click, with no confirmation — one misclick
 * on a fast trackpad and content a family's report depends on, or a course an
 * admin just wrote, is gone. For a "new" (draft-only) row this is doubly
 * sharp: there is no shipped original to fall back to, so the delete is
 * final the moment it fires.
 *
 * The first click swaps the label to a plain-language confirmation and turns
 * the button red; the second click, while still armed, actually deletes.
 * Anything else — moving on, waiting a few seconds, editing another row —
 * disarms it, so a delete never fires from a click the admin didn't mean as
 * a delete.
 */
export function ConfirmDeleteButton({
  onConfirm,
  label = "Delete",
  confirmLabel = "Click again to delete",
  size = "sm",
}: {
  onConfirm: () => void;
  label?: string;
  confirmLabel?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(false), 3000);
    return () => window.clearTimeout(timer);
  }, [armed]);

  return (
    <Button
      type="button"
      size={size}
      variant="ghost"
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
      onBlur={() => setArmed(false)}
      style={
        armed
          ? { color: "var(--st-consult)", background: "var(--st-consult-soft)" }
          : undefined
      }
    >
      {armed ? confirmLabel : label}
    </Button>
  );
}
