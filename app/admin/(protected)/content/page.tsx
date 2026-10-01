"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card, Button, domainColor, domainName, InlineBanner, useBanner } from "@/components/ui";
import { ADMIN_DOMAINS } from "@/lib/admin/content";
import { IconCheck, IconShield, IconVisual, IconAuditory, IconTactile, IconMobility, IconLanguage, IconManual } from "@/components/ui/icons";

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
  
  const [activeTab, setActiveTab] = useState<string>("general");
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
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
      </div>
    );
  }

  const filteredBlocks = blocks.filter(b => {
    if (activeTab === "general") return !b.id.startsWith("domain_note_");
    return b.id.startsWith(`domain_note_${activeTab}_`);
  });

  function getGradeHeading(id: string) {
    if (id.endsWith("_a_plus_plus")) return "Grade A++ (Beyond Expectation)";
    if (id.endsWith("_a_plus")) return "Grade A+ (Exceeding)";
    if (id.endsWith("_a_minus_minus")) return "Grade A-- (Needs Immediate Support)";
    if (id.endsWith("_a_minus")) return "Grade A- (Needs Focus)";
    if (id.endsWith("_a")) return "Grade A (On Track)";
    if (id === "report_disclaimer") return "Report Disclaimer";
    return id;
  }

  const DOMAIN_ICONS: Record<string, React.ReactNode> = {
    vision: <IconVisual size={20} />,
    auditory: <IconAuditory size={20} />,
    tactile: <IconTactile size={20} />,
    mobility: <IconMobility size={20} />,
    language: <IconLanguage size={20} />,
    hand: <IconManual size={20} />
  };

  return (
    <div className="mx-auto max-w-7xl pb-12">
      <InlineBanner message={banner.message} onDismiss={banner.clear} />
      
      <div className="mb-8 border-b border-line pb-6 pt-4">
        <h1 className="text-3xl font-extrabold text-ink tracking-tight">Report Narratives</h1>
        <p className="mt-2 max-w-3xl text-base text-ink-3">
          Manage the text shown on the printed reports. Select a section from the sidebar to edit the narratives.
        </p>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        
        {/* Sidebar Navigation */}
        <div className="w-full shrink-0 md:w-64">
          <div className="sticky top-6 flex flex-col gap-1 rounded-2xl border border-line bg-white p-2 shadow-sm">
            <button
              onClick={() => setActiveTab("general")}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                activeTab === "general" ? "bg-ink text-white shadow-md" : "text-ink-2 hover:bg-surface-2"
              }`}
            >
              <IconShield size={20} className={activeTab === "general" ? "text-white" : "text-ink-4"} />
              <span className="font-bold text-sm">General Settings</span>
            </button>

            <div className="my-2 border-b border-line-soft mx-2"></div>
            <h3 className="mb-2 px-4 text-[10px] font-extrabold uppercase tracking-widest text-ink-4">Competencies</h3>

            {ADMIN_DOMAINS.map((domain) => {
              const isActive = activeTab === domain.code;
              return (
                <button
                  key={domain.code}
                  onClick={() => setActiveTab(domain.code)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                    isActive ? "text-white shadow-md" : "text-ink-2 hover:bg-surface-2"
                  }`}
                  style={isActive ? { backgroundColor: domainColor(domain.code as any) } : {}}
                >
                  <span className={isActive ? "text-white" : "text-ink-4"}>{DOMAIN_ICONS[domain.code]}</span>
                  <span className="font-bold text-sm">{domainName(domain.code as any)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab !== "general" && (
            <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-blue-900">
                <IconCheck size={16} className="text-blue-600" />
                Available Dynamic Tags
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-blue-800">
                You can insert these placeholders into your text. The system will automatically replace them with the child&apos;s actual data.
              </p>
              <div className="flex flex-wrap gap-3 font-mono text-xs">
                <span className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-blue-900 shadow-sm">{'{name}'} <span className="ml-1 font-sans text-ink-4">e.g. Vishal</span></span>
                <span className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-blue-900 shadow-sm">{'{age}'} <span className="ml-1 font-sans text-ink-4">e.g. 2 yrs 3 mos</span></span>
                <span className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-blue-900 shadow-sm">{'{he_she}'} <span className="ml-1 font-sans text-ink-4">he / she / they</span></span>
                <span className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-blue-900 shadow-sm">{'{his_her}'} <span className="ml-1 font-sans text-ink-4">his / her / their</span></span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {filteredBlocks.map((block) => (
              <Card key={block.id} className="overflow-hidden border border-line p-0 shadow-sm transition-shadow hover:shadow-md">
                <div className="border-b border-line bg-surface/50 px-6 py-4">
                  <h2 className="text-lg font-bold text-ink">{getGradeHeading(block.id)}</h2>
                  {block.description && <p className="mt-1 text-sm text-ink-3">{block.description}</p>}
                </div>
                
                <div className="p-6">
                  <textarea
                    className="field min-h-[140px] resize-y leading-relaxed text-ink"
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, e.target.value)}
                  />
                  
                  <div className="mt-4 flex justify-end">
                    <Button 
                      onClick={() => handleSave(block)} 
                      disabled={savingId === block.id}
                      variant="primary"
                      className="px-8 font-bold"
                    >
                      {savingId === block.id ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {filteredBlocks.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line py-20 text-center">
                <p className="text-lg font-bold text-ink-3">No content found</p>
                <p className="mt-1 text-sm text-ink-4">There are no configurable items in this section.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
