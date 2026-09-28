"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card, Button, domainColor, domainName, InlineBanner, useBanner } from "@/components/ui";
import { ADMIN_DOMAINS } from "@/lib/admin/content";
import { IconCheck } from "@/components/ui/icons";

interface CmsBlock {
  id: string;
  content: string;
  description: string;
}

export default function CmsContentPage() {
  const [blocks, setBlocks] = useState<CmsBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const banner = useBanner();
  
  // "general" is for disclaimer, etc.
  const tabs = [...ADMIN_DOMAINS.map(d => d.code), "general"];
  const [activeTab, setActiveTab] = useState<string>(tabs[0]);
  
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    let active = true;
    (supabase as any)
      .from("cms_blocks")
      .select("*")
      .order("id")
      .then(({ data, error }: { data: any, error: any }) => {
        if (error) console.error("Error loading CMS:", error);
        if (active) {
          if (data) setBlocks(data);
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, [supabase]);


  async function handleSave(block: CmsBlock) {
    setSavingId(block.id);
    const { error } = await (supabase as any)
      .from("cms_blocks")
      .update({ 
        content: block.content,
        updated_at: new Date().toISOString()
      })
      .eq("id", block.id);
      
    if (error) {
      banner.showError("Failed to save: " + error.message);
    } else {
      banner.showSuccess("Changes saved successfully!");
    }
    setSavingId(null);
  }

  function updateBlock(id: string, newContent: string) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: newContent } : b));
  }

  if (loading) {
    return <div className="p-8 text-ink-3">Loading CMS...</div>;
  }

  const filteredBlocks = blocks.filter(b => {
    if (activeTab === "general") return !b.id.startsWith("domain_note_");
    return b.id.startsWith(`domain_note_${activeTab}_`);
  });

  function getGradeHeading(id: string) {
    if (id.endsWith("_a_plus_plus")) return "Grade: A++";
    if (id.endsWith("_a_plus")) return "Grade: A+";
    if (id.endsWith("_a_minus_minus")) return "Grade: A--";
    if (id.endsWith("_a_minus")) return "Grade: A-";
    if (id.endsWith("_a")) return "Grade: A";
    if (id === "report_disclaimer") return "Report Disclaimer";
    return id;
  }

  return (
    <div className="space-y-6 pb-10">
      <InlineBanner message={banner.message} onDismiss={banner.clear} />
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Report Narratives</h1>
          <p className="mt-1 text-sm text-ink-3">
            Edit the text shown in the printed reports. You can use <code>{'{name}'}</code> and <code>{'{domain}'}</code> as placeholders.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isGeneral = tab === "general";
          const label = isGeneral ? "General" : domainName(tab as any);
          const bg = isGeneral ? "var(--ink)" : domainColor(tab as any);
          const isActive = activeTab === tab;
          
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="chip cursor-pointer"
              style={
                isActive
                  ? ({ "--chip-bg": bg, "--chip-fg": "#fff", "--chip-bd": "transparent" } as React.CSSProperties)
                  : ({ "--chip-bg": "var(--surface-2)", "--chip-fg": "var(--ink-2)", "--chip-bd": "transparent" } as React.CSSProperties)
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="space-y-6">
        {filteredBlocks.map(block => (
          <Card key={block.id} className="p-6">
            <h2 className="text-xl font-bold text-ink mb-3">{getGradeHeading(block.id)}</h2>
            
            <textarea
              className="field min-h-[140px]"
              value={block.content}
              onChange={(e) => updateBlock(block.id, e.target.value)}
            />
            
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={() => handleSave(block)} 
                disabled={savingId === block.id}
                variant="primary"
              >
                {savingId === block.id ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </Card>
        ))}
        {filteredBlocks.length === 0 && (
          <div className="text-center py-12 text-ink-3">No content found for this section.</div>
        )}
      </div>
    </div>
  );
}
