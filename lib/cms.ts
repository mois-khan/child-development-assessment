import { getSupabaseBrowserClient } from "./supabase/client";

let cmsCache: Record<string, string> = {};
let loaded = false;

export async function primeCmsBank(): Promise<void> {
  if (loaded) return;
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await (supabase as any).from("cms_blocks").select("id, content");
  
  if (error) {
    console.error("Failed to load CMS blocks:", error);
    return;
  }
  
  if (data) {
    (data as any[]).forEach((block) => {
      cmsCache[block.id] = block.content;
    });
  }
  loaded = true;
}

export function cmsReady(): boolean {
  return loaded;
}

export function getCmsText(id: string, defaultText: string, variables?: Record<string, string>): string {
  // If we haven't registered this default yet in dev, we could theoretically do it,
  // but it's cleaner to just let the admin dashboard seed it if missing.
  let text = cmsCache[id] ?? defaultText;
  
  if (variables) {
    for (const [k, v] of Object.entries(variables)) {
      text = text.replace(new RegExp(`{${k}}`, "g"), v);
    }
  }
  
  return text;
}
