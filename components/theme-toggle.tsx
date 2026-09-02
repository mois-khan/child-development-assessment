"use client";

import { useEffect, useState } from "react";

const KEY = "kaushalya.theme";

type Theme = "light" | "dark";

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/**
 * Reads the theme the blocking script in the document head already applied,
 * so the first client render matches what is on screen instead of flashing.
 */
function currentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(currentTheme());
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      // Private browsing, or storage full — the toggle still works for the
      // rest of this visit, it just will not be remembered next time.
    }
    setTheme(next);
  }

  // Avoid claiming a mode before the effect confirms what the head script
  // actually applied.
  if (!mounted) {
    return (
      <button
        type="button"
        className="btn btn-quiet btn-sm"
        aria-label="Toggle light or dark mode"
        disabled
      >
        <SunIcon />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn btn-quiet btn-sm"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

/** Inline script for the document head — sets data-theme before first paint
 * so switching themes never flashes the wrong one. Falls back to the OS
 * preference (handled by the plain @media rule in globals.css) when nothing
 * has been chosen yet, so it only needs to act on an explicit saved choice. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  KEY,
)});if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;

function SunIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="3.6" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 1.8v2.1M10 16.1v2.1M18.2 10h-2.1M3.9 10H1.8M15.7 4.3l-1.5 1.5M5.8 14.2l-1.5 1.5M15.7 15.7l-1.5-1.5M5.8 5.8 4.3 4.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M17.3 12.4A7.4 7.4 0 0 1 7.6 2.7a7.6 7.6 0 1 0 9.7 9.7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
