"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";

type ExtractionResponse = {
  fields: Record<string, Record<string, Array<Record<string, unknown>>>>;
  tasks: string[];
};

export function ExtractionScreen({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [data, setData] = useState<ExtractionResponse | null>(null);
  const [activeTab, setActiveTab] = useState("financials");
  const [autosave, setAutosave] = useState("Auto-save pending");

  const refresh = useCallback(async () => {
    const payload = await api.getExtraction(caseId);
    setData(payload);
  }, [caseId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!data) {
    return <div>Loading extraction cockpit...</div>;
  }

  const sections = data.fields[activeTab] ?? {};

  async function editValue(section: string, fieldId: string, value: string) {
    await api.updateField(caseId, {
      tab: activeTab,
      section,
      field_id: fieldId,
      value: Number.isNaN(Number(value)) ? value : Number(value),
    });
    setAutosave("Auto-save OK");
    await refresh();
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[1.1fr_1.5fr_1fr]">
      <div className="border-[3px] border-[#2d2d2d] bg-white p-3">
        <div className="mb-2 text-xl font-bold">Document Viewer</div>
        <div className="grid gap-2 md:grid-cols-[72px_1fr]">
          <div className="space-y-2">
            {[82, 83, 84, 91].map((pg) => (
              <button key={pg} className="w-full border-2 border-[#2d2d2d] bg-[#fff9c4] p-2 text-xs">Pg {pg}</button>
            ))}
          </div>
          <div className="min-h-[460px] border-2 border-[#2d2d2d] bg-[#fdfbf7] p-3">
            <div className="mb-2 border-2 border-dashed border-yellow-600 bg-yellow-100 p-2 text-xs">PAT FY24 mapped to Financials.PAT</div>
            <div className="mb-2 border-2 border-dashed border-yellow-600 bg-yellow-100 p-2 text-xs">NNPA mapped to Asset Quality.NNPA</div>
            <div className="text-sm">PDF preview placeholder with highlighted extraction overlays.</div>
          </div>
        </div>
      </div>

      <div className="border-[3px] border-[#2d2d2d] bg-white p-3">
        <div className="mb-3 flex flex-wrap gap-2">
          {["financials", "alm", "shareholding", "borrowings", "portfolio"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`border-2 border-[#2d2d2d] px-3 py-1 ${tab === activeTab ? "bg-[#2d5da1] text-white" : "bg-[#fdfbf7]"}`}>
              {tab[0].toUpperCase() + tab.slice(1)}
            </button>
          ))}
          <span className="ml-auto text-xs">{autosave}</span>
        </div>

        {Object.keys(sections).length === 0 ? <div>No fields for this tab yet.</div> : null}

        <div className="space-y-4">
          {Object.entries(sections).map(([sectionName, rows]) => (
            <div key={sectionName} className="border-2 border-[#2d2d2d] p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-lg font-bold">{sectionName.replaceAll("_", " ")}</div>
                <div className="text-xs text-green-700">PAT Growth YoY: +51%</div>
              </div>
              <div className="space-y-2">
                {rows.map((row) => {
                  const item = row as Record<string, unknown>;
                  return (
                    <div key={String(item.id)} className="grid gap-2 border border-[#2d2d2d] p-2 md:grid-cols-[1.4fr_1fr_auto] md:items-center">
                      <div>
                        <div>{String(item.label)}</div>
                        <div className="text-xs">{String(item.badge)}</div>
                        {item.edited_at ? <div className="text-xs text-blue-700">Edited by You - {String(item.edited_at)}</div> : null}
                      </div>
                      <input
                        className={`border-2 p-1 ${item.status === "warning" ? "border-yellow-500" : "border-[#2d2d2d]"}`}
                        defaultValue={String(item.value ?? "")}
                        onBlur={(e) => void editValue(sectionName, String(item.id), e.target.value)}
                      />
                      <span className={`border px-2 py-1 text-xs ${item.status === "warning" ? "bg-yellow-200" : "bg-green-200"}`}>{String(item.status)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="border-[3px] border-[#2d2d2d] bg-white p-3">
          <div className="mb-2 text-lg font-bold">Document Classification & Tasks</div>
          <div className="space-y-2 text-sm">
            <div className="border-2 border-[#2d2d2d] p-2">moneyboxx-fy24.pdf - Annual Report [Approve / Reclassify]</div>
            <div className="border-2 border-[#2d2d2d] p-2">kinara-alm.xlsx - ALM Statement [Approve / Reclassify]</div>
          </div>
        </div>
        <div className="border-[3px] border-[#2d2d2d] bg-[#fff9c4] p-3">
          <div className="text-lg font-bold">To Review</div>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {data.tasks.map((task) => (
              <li key={task}>{task}</li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => router.push(`/case/${caseId}/risk-cam`)}
          className="w-full border-[3px] border-[#2d2d2d] bg-[#2d5da1] px-4 py-3 text-white"
        >
          Continue to Risk and CAM
        </button>
      </div>
    </section>
  );
}
