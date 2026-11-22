/**
 * Crash-proof sharing and link copying.
 *
 * Supports native Web Share API on mobile (WhatsApp, Gmail, Messages, etc.),
 * falling back to the Clipboard API, and finally to document.execCommand for
 * insecure HTTP contexts (e.g. testing over local WiFi 192.168.x.x).
 */
export async function safeShare(
  url: string,
  title: string,
  text: string,
  onCopied?: () => void,
): Promise<void> {
  // 1. Mobile native share sheet (WhatsApp, Messages, etc.)
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (err: any) {
      // If user aborted or dismissed the share sheet, do not copy
      if (err?.name === "AbortError") return;
    }
  }

  // 2. Clipboard API in Secure Context (HTTPS or localhost)
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(url);
      onCopied?.();
      return;
    } catch {
      // Fall through to execCommand
    }
  }

  // 3. Fallback for insecure HTTP contexts (e.g. http://192.168.x.x)
  try {
    const el = document.createElement("textarea");
    el.value = url;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.left = "-9999px";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    if (ok) {
      onCopied?.();
      return;
    }
  } catch {
    // Fall through to prompt
  }

  if (typeof window !== "undefined") {
    window.prompt("Copy link:", url);
  }
}
