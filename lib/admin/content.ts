/**
 * Item bank editing — the admin panel's view of it.
 *
 * The bank itself lives in lib/item-bank.ts so the scoring engine and the
 * assessment walk (neither of which is admin code) can read the same result
 * without importing anything under lib/admin/. Everything here is a
 * re-export plus the two content tables the admin UI renders its filters
 * from.
 *
 * The bank is the only source of questions — see lib/item-bank.ts for why
 * there is no code-level base bank behind it any more.
 */
import { DOMAINS } from "@/content/domains";
import { BRAIN_STAGES } from "@/content/stages";

export {
  adminListItems,
  adminSaveItem,
  adminDeleteItem,
  liveItemsFor,
  liveScoredItemsFor,
  primeItemBank,
  itemBankReady,
  itemBankLoadFailed,
  itemBankSize,
} from "@/lib/item-bank";

export type { AdminItem, ItemInput, ItemStatus } from "@/lib/item-bank";

export const ADMIN_DOMAINS = DOMAINS;
export const ADMIN_STAGES = BRAIN_STAGES;
