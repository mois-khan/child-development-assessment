import { Button } from "./primitives";
import { Mascot } from "./illustrations";

/**
 * The one thing every detail page in the app was missing: a distinct branch
 * for "the fetch failed" that isn't silently indistinguishable from
 * "still loading" or "genuinely doesn't exist". Pair with a state machine of
 * `T | null | undefined | "error"` — undefined while loading, null when the
 * row truly isn't found, "error" when the request itself failed.
 */
export function LoadError({
  message = "Something went wrong loading this page. Check your connection and try again.",
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div className="pt-20 text-center">
      <Mascot size={90} mood="think" className="mx-auto" />
      <h1 className="mt-6">We couldn&rsquo;t load this</h1>
      <p className="lede mx-auto mt-3 max-w-[38ch]">{message}</p>
      <Button className="mt-8" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
