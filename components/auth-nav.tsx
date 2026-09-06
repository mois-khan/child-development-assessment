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
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="hidden text-[0.88rem] font-bold text-ink hover:text-accent md:inline transition-colors"
          title="View Parent Profile"
        >
          {profile?.fullName || user.email}
        </Link>
        <ButtonLink href="/profile" variant="ghost" size="sm">
          Profile
        </ButtonLink>
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

  const targetNext = !pathname || pathname === "/" || pathname === "/join" ? "/profile" : pathname;

  return (
    <ButtonLink href={`/join?next=${encodeURIComponent(targetNext)}`} size="sm" iconRight={<IconArrowRight size={16} />}>
      Sign in
    </ButtonLink>
  );
}
