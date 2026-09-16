import { redirect } from "next/navigation";

/**
 * The old home for account details, children, assessments, payments, and
 * course upsells all at once — split into /settings (account, notifications,
 * billing) with /children and /children/[id] as the single source of truth
 * for family and report data. Kept as a redirect for old links and bookmarks.
 */
export default function ProfilePage() {
  redirect("/settings/account");
}
