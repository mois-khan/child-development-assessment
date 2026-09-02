"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * The old single-form intake flow. Child profiles now live at /children, so
 * this just forwards there — kept so any old link or bookmark still works.
 */
export default function StartRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/children");
  }, [router]);
  return null;
}
