"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Analytics now lives on the dashboard itself — this route just sends old links there. */
export default function AdminAnalyticsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin");
  }, [router]);
  return null;
}
