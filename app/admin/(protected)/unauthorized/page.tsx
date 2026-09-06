"use client";

import Link from "next/link";
import { Card, Mascot, ButtonLink, IconLock } from "@/components/ui";

/**
 * Shown when an authenticated admin user hits a page they don't have
 * access to. The super_admin can grant access via User Management.
 */
export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card variant="clay" className="max-w-md w-full p-8 text-center">
        <span className="inline-grid size-14 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] mx-auto">
          <IconLock size={26} />
        </span>

        <Mascot size={72} mood="think" className="mx-auto mt-4" />

        <h2 className="mt-5 text-2xl">Access restricted</h2>
        <p className="mt-2.5 text-base leading-relaxed text-ink-2">
          You don&apos;t have permission to view this page. Ask your super admin
          to enable access for your account.
        </p>

        <div className="mt-7 flex flex-col gap-2.5">
          <ButtonLink href="/admin" variant="secondary" block>
            Back to Dashboard
          </ButtonLink>
        </div>

        <p className="mt-5 text-xs text-ink-3">
          If you believe this is an error, contact your super admin or{" "}
          <Link
            href="mailto:support@kaushalyageniuskid.com"
            className="underline hover:text-ink"
          >
            support@kaushalyageniuskid.com
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
