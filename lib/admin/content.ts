/**
 * Item bank editing — the admin panel's view of it.
 *
 * The bank itself moved to lib/item-bank.ts so the scoring engine and the
 * assessment walk (neither of which is admin code) can read the same merged
 * result without importing anything under lib/admin/. Everything here is a
 * re-export plus the two content tables the admin UI renders its filters
 * from.
 *
 * Base questions still live in version-controlled TypeScript under content/ —
 * it is a clinical instrument, and having it reviewable in git beats having
 * it editable by a stray click. What Supabase holds (0006_item_bank.sql) is
 * the diff on top: edits, additions and retirements. An edit is live for
 * every parent as soon as it saves; there is no draft/publish step yet.
 */
import { DOMAINS } from "@/content/domains";
import { BRAIN_STAGES } from "@/content/stages";

export {
  adminListItems,
  adminSaveItem,
  adminDeleteItem,
  adminRevertItem,
  liveItemsFor,
  liveScoredItemsFor,
  primeItemBank,
  itemBankReady,
  overlayCount,
} from "@/lib/item-bank";

export type { AdminItem, ItemInput, ItemStatus } from "@/lib/item-bank";

export const ADMIN_DOMAINS = DOMAINS;
export const ADMIN_STAGES = BRAIN_STAGES;
