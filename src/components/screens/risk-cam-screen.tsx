"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import type { RecommendationResponse, ResearchItem } from "@/lib/types";

type CamSection = {
  title: string;
  content: string;
};

export function RiskCamScreen({ caseId, initialTab }: { caseId: string; initialTab?: string }) {
  const [tab, setTab] = useState(initialTab === "research" || initialTab === "cam" ? initialTab : "risk");
  const [research, setResearch] = useState<ResearchItem[]>([]);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [camPreview, setCamPreview] = useState<{ sections: CamSection[]; trace: string; generated_at: string; template: string } | null>(null);

  const refreshResearch = useCallback(async () => {
    const payload = await api.getResearch(caseId);
    setResearch(payload);
  }, [caseId]);

  useEffect(() => {
    async function load() {
      await refreshResearch();
      const [recommendationData, camData] = await Promise.all([
        api.getRecommendation(caseId),
        api.getCamPreview(caseId),
      ]);
      setRecommendation(recommendationData);
      setCamPreview(camData as { sections: CamSection[]; trace: string; generated_at: string; template: string });
    }

    void load();
  }, [caseId, refreshResearch]);

  const keyThemes = useMemo(() => research.filter((item) => item.included_in_cam).map((item) => item.title).slice(0, 3), [research]);

  async function toggle(item: ResearchItem) {
    await api.toggleResearch(caseId, item.id, !item.included_in_cam);
    await refreshResearch();
    const data = await api.getRecommendation(caseId);
    setRecommendation(data);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[{ key: "risk", label: "Risk Dashboard" }, { key: "research", label: "Research Feed" }, { key: "cam", label: "CAM Report" }].map((item) => (
          <button key={item.key} onClick={() => setTab(item.key)} className={`border-[3px] border-[#2d2d2d] px-4 py-2 ${tab === item.key ? "bg-[#2d5da1] text-white" : "bg-white"}`}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === "risk" && recommendation ? (
        <div className="space-y-4">
          <div className="border-[3px] border-[#2d2d2d] bg-white p-4">
            <div className="text-3xl font-bold">Credit Score: {recommendation.score} / 100</div>
            <div className="mt-1 inline-block border-2 border-[#2d2d2d] bg-[#fff9c4] px-3 py-1">{recommendation.tag}</div>
            <div className="mt-2 text-sm">Based on financials, asset quality, governance, external risk and collateral.</div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="border-[3px] border-[#2d2d2d] bg-white p-4">
              <div className="text-xl font-bold">Credit Decision</div>
              <div className="mt-2 text-2xl">Recommend: {recommendation.recommendation}</div>
              <div className="mt-3 space-y-1 text-sm">
                <div>Base Rate (MCLR 1Y): {recommendation.rate.base_rate}%</div>
                <div>Credit Risk Premium: +{recommendation.rate.credit_risk_premium}%</div>
                <div>TN Concentration Risk: +{recommendation.rate.tn_concentration_risk}%</div>
                <div>Regulatory Risk (RBI Oct 2024): +{recommendation.rate.regulatory_risk}%</div>
                <div>Liquidity Monitoring Overlay: +{recommendation.rate.liquidity_risk}%</div>
                <div className="border-t-2 border-[#2d2d2d] pt-2 text-lg font-bold">Final Recommended Rate: {recommendation.rate.final_recommended_rate}%</div>
              </div>
            </div>

            <div className="border-[3px] border-[#2d2d2d] bg-white p-4">
              <div className="text-xl font-bold">Score Breakdown</div>
              <div className="mt-3 space-y-2 text-sm">
                {recommendation.breakdown.map((row) => (
                  <div key={row.factor} className="grid gap-2 border-2 border-[#2d2d2d] p-2 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
                    <span>{row.factor}</span>
                    <span>{row.score}</span>
                    <span>{row.points}</span>
                    <span className="text-blue-700" title={row.why}>Why?</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-[3px] border-[#2d2d2d] bg-white p-4">
            <div className="text-xl font-bold">Covenants</div>
            <ul className="mt-2 space-y-2">
              {recommendation.covenants.map((c) => (
                <li key={c.text} className="flex items-center gap-2">
                  <span>{c.text}</span>
                  <span className="border-2 border-[#2d2d2d] bg-[#e5e0d8] px-2 text-xs">{c.tag}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-[3px] border-[#2d2d2d] bg-white p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xl font-bold">AI Analyst Reasoning</div>
              <span className={`border-2 border-[#2d2d2d] px-2 py-1 text-xs ${recommendation.llm_reasoning?.source === "live" ? "bg-green-200" : "bg-yellow-200"}`}>
                {recommendation.llm_reasoning?.source === "live" ? "Live AI" : "Fallback"}
              </span>
            </div>

            {!recommendation.llm_reasoning ? (
              <div className="text-sm">Reasoning block is unavailable for this request.</div>
            ) : (
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-bold">Methodology</div>
                  <div>{recommendation.llm_reasoning.methodology}</div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="border-2 border-[#2d2d2d] p-2">
                    <div className="font-bold">Key Risks</div>
                    {recommendation.llm_reasoning.key_risks.length === 0 ? <div>None highlighted.</div> : recommendation.llm_reasoning.key_risks.map((x) => <div key={x}>- {x}</div>)}
                  </div>
                  <div className="border-2 border-[#2d2d2d] p-2">
                    <div className="font-bold">Mitigants</div>
                    {recommendation.llm_reasoning.mitigants.length === 0 ? <div>None highlighted.</div> : recommendation.llm_reasoning.mitigants.map((x) => <div key={x}>- {x}</div>)}
                  </div>
                </div>

                <div>
                  <div className="font-bold">Pricing Logic</div>
                  <div>{recommendation.llm_reasoning.pricing_logic}</div>
                </div>

                <div>
                  <div className="font-bold">Covenant Rationale</div>
                  <div className="space-y-1">
                    {Object.keys(recommendation.llm_reasoning.covenant_rationale).length === 0 ? (
                      <div>No covenant rationale generated.</div>
                    ) : (
                      Object.entries(recommendation.llm_reasoning.covenant_rationale).map(([k, v]) => (
                        <div key={k}><span className="font-bold">{k}:</span> {v}</div>
                      ))
                    )}
                  </div>
                </div>

                <div className="text-xs">
                  Confidence: {Math.round(recommendation.llm_reasoning.confidence * 100)}% | Generated: {recommendation.llm_reasoning.generated_at}
                  {recommendation.llm_reasoning.fallback_reason ? ` | Reason: ${recommendation.llm_reasoning.fallback_reason}` : ""}
                </div>
              </div>
            )}
          </div>

          <div className="border-[3px] border-[#2d2d2d] bg-white p-4">
            <div className="text-xl font-bold">SWOT Snapshot</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm">
              <div className="border-2 border-[#2d2d2d] p-2"><div className="font-bold">Strengths</div>{recommendation.swot.strengths.map((x) => <div key={x}>- {x}</div>)}</div>
              <div className="border-2 border-[#2d2d2d] p-2"><div className="font-bold">Weaknesses</div>{recommendation.swot.weaknesses.map((x) => <div key={x}>- {x}</div>)}</div>
              <div className="border-2 border-[#2d2d2d] p-2"><div className="font-bold">Opportunities</div>{recommendation.swot.opportunities.map((x) => <div key={x}>- {x}</div>)}</div>
              <div className="border-2 border-[#2d2d2d] p-2"><div className="font-bold">Threats</div>{recommendation.swot.threats.map((x) => <div key={x}>- {x}</div>)}</div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "research" ? (
        <div className="grid gap-4 lg:grid-cols-[1.8fr_1fr]">
          <div className="space-y-3">
            {research.map((item) => (
              <div key={item.id} className="border-[3px] border-[#2d2d2d] bg-white p-4">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className={`border-2 border-[#2d2d2d] px-2 py-1 ${item.risk === "red" ? "bg-red-300" : item.risk === "amber" ? "bg-yellow-300" : "bg-green-300"}`}>{item.risk}</span>
                  <span>{item.source} - {item.date}</span>
                </div>
                <div className="text-lg font-bold underline">{item.title}</div>
                <p className="text-sm">{item.summary}</p>
                <div className="mt-2 border-l-4 border-[#2d2d2d] pl-2 text-sm">{item.impact}</div>
                <button onClick={() => void toggle(item)} className="mt-2 border-2 border-[#2d2d2d] px-2 py-1 text-sm">
                  {item.included_in_cam ? "Included in CAM" : "Excluded from CAM"}
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="border-[3px] border-[#2d2d2d] bg-[#fff9c4] p-4">
              <div className="text-lg font-bold">Key Themes</div>
              <ul className="mt-2 list-disc pl-4 text-sm">
                {keyThemes.length === 0 ? <li>No themes selected.</li> : keyThemes.map((theme) => <li key={theme}>{theme}</li>)}
              </ul>
            </div>
            <div className="border-[3px] border-[#2d2d2d] bg-white p-4 text-sm">
              <div className="font-bold">Litigation & Legal</div>
              <div>No active litigation found in public court records for this entity, based on last 3 years of data.</div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "cam" && camPreview ? (
        <div className="border-[3px] border-[#2d2d2d] bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#2d2d2d] pb-3">
            <select className="border-2 border-[#2d2d2d] p-2">
              <option>Standard NBFC</option>
              <option>Co-lending</option>
            </select>
            <div className="text-xs">Template: {camPreview.template} | Generated: {camPreview.generated_at}</div>
            <div className="flex gap-2">
              <a
                href={`/api/cam/${caseId}/download/word`}
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-[#2d2d2d] bg-[#2d5da1] px-3 py-2 text-white"
              >
                Download Word
              </a>
              <a
                href={`/api/cam/${caseId}/download/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-[#2d2d2d] bg-[#fff9c4] px-3 py-2"
              >
                Download PDF
              </a>
            </div>
          </div>
          <div className="space-y-3">
            {camPreview.sections.map((section) => (
              <div key={section.title} className="border-2 border-[#2d2d2d] p-3">
                <div className="text-lg font-bold">{section.title}</div>
                <div className="mt-1 text-sm">{section.content}</div>
                <div className="text-sm" title={camPreview.trace}>Traceable values linked to extraction sources and reviewed research evidence.</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
