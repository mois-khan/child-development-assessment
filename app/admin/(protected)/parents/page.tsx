"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Parents now lives on the Leads page — every parent has exactly one lead,
 *  and the Leads worklist already shows name, phone, email and status. */
export default function AdminParentsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/leads");
  }, [router]);
  return null;
}
