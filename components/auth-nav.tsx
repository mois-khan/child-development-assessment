"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/provider";
import { Button, ButtonLink } from "@/components/ui/primitives";
import { IconArrowRight } from "@/components/ui/icons";

export function AuthNav() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (loading) return null;

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="hidden text-[0.88rem] font-medium text-ink-2 md:inline">
          {profile?.fullName || user.email}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
        >
          Sign out
        </Button>
      </div>
    );
  }

  if (pathname === "/join") return null;

  return (
    <ButtonLink href={`/join?next=${encodeURIComponent(pathname)}`} size="sm" iconRight={<IconArrowRight size={16} />}>
      Sign in
    </ButtonLink>
  );
}
