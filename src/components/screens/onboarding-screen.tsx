"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import type { CaseRecord, OnboardingData } from "@/lib/types";

const tabs = ["Company", "Financials", "Loan Details"] as const;

function toNumber(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function OnboardingScreen({ caseData, onSaved }: { caseData: CaseRecord; onSaved: () => Promise<void> }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Company");
  const [mcaVerified, setMcaVerified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<OnboardingData>(caseData.onboarding);

  const progress = useMemo(() => ((tabs.indexOf(activeTab) + 1) / tabs.length) * 100, [activeTab]);

  function updateField<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveAndContinue() {
    setSaving(true);
    await api.updateCase(caseData.id, form, 2);
    await onSaved();
    setSaving(false);
    router.push(`/case/${caseData.id}/documents`);
  }

  return (
    <section className="mx-auto max-w-3xl border-[3px] border-[#2d2d2d] bg-white p-6 shadow-[6px_6px_0px_0px_#2d2d2d]" style={{ borderRadius: "22px 140px 30px 120px / 120px 20px 130px 30px" }}>
      <div className="mb-5">
        <div className="text-sm">Step 1 of 4 - Entity Onboarding</div>
        <div className="mt-2 h-2 w-full border-2 border-[#2d2d2d] bg-[#e5e0d8]">
          <div className="h-full bg-[#2d5da1]" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mb-5 flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`border-[3px] px-4 py-2 shadow-[3px_3px_0px_0px_#2d2d2d] ${tab === activeTab ? "bg-[#2d5da1] text-white" : "bg-[#fdfbf7]"}`}
            style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Company" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span>CIN</span>
            <div className="flex gap-2">
              <input className="w-full border-2 border-[#2d2d2d] p-2" value={form.cin} onChange={(e) => updateField("cin", e.target.value)} />
              <button
                type="button"
                onClick={() => {
                  updateField("company_name", "Kinara Capital");
                  setMcaVerified(true);
                }}
                className="border-2 border-[#2d2d2d] bg-[#fff9c4] px-2"
              >
                Fetch from MCA
              </button>
            </div>
            {mcaVerified ? <div className="inline-block border-2 border-green-700 bg-green-100 px-2 py-1 text-xs">MCA OK Verified</div> : null}
          </label>
          <label className="space-y-1">
            <span>PAN</span>
            <input className="w-full border-2 border-[#2d2d2d] p-2" value={form.pan} onChange={(e) => updateField("pan", e.target.value)} />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span>Company Name</span>
            <input readOnly className="w-full border-2 border-[#2d2d2d] bg-[#e5e0d8] p-2" value={form.company_name} />
          </label>
          <label className="space-y-1">
            <span>Entity Type</span>
            <select className="w-full border-2 border-[#2d2d2d] p-2" value={form.entity_type} onChange={(e) => updateField("entity_type", e.target.value)}>
              <option value="">Select</option>
              <option value="NBFC-MFI">NBFC-MFI</option>
              <option value="NBFC-ICC">NBFC-ICC</option>
            </select>
          </label>
          <label className="space-y-1">
            <span>Incorporation Date</span>
            <input type="date" className="w-full border-2 border-[#2d2d2d] p-2" value={form.incorporation_date} onChange={(e) => updateField("incorporation_date", e.target.value)} />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span>Sector</span>
            <input
              className="w-full border-2 border-[#2d2d2d] p-2"
              placeholder="NBFC, Microfinance"
              value={form.sector.join(", ")}
              onChange={(e) => updateField("sector", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))}
            />
          </label>
        </div>
      ) : null}

      {activeTab === "Financials" ? (
        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span>Turnover (INR Cr)</span>
              <input className="w-full border-2 border-[#2d2d2d] p-2" value={form.turnover_cr ?? ""} onChange={(e) => updateField("turnover_cr", toNumber(e.target.value))} />
            </label>
            <label className="space-y-1">
              <span>AUM (INR Cr)</span>
              <input className="w-full border-2 border-[#2d2d2d] p-2" value={form.aum_cr ?? ""} onChange={(e) => updateField("aum_cr", toNumber(e.target.value))} />
            </label>
            <label className="space-y-1">
              <span>Net Worth (INR Cr)</span>
              <input className="w-full border-2 border-[#2d2d2d] p-2" value={form.net_worth_cr ?? ""} onChange={(e) => updateField("net_worth_cr", toNumber(e.target.value))} />
            </label>
            <label className="space-y-1">
              <span>Rating Agency</span>
              <select className="w-full border-2 border-[#2d2d2d] p-2" value={form.rating_agency} onChange={(e) => updateField("rating_agency", e.target.value)}>
                <option value="">Select</option>
                <option value="CRISIL">CRISIL</option>
                <option value="ICRA">ICRA</option>
              </select>
            </label>
            <label className="space-y-1 md:col-span-2">
              <span>Rating Grade</span>
              <input className="w-full border-2 border-[#2d2d2d] p-2" placeholder="CRISIL A- (Stable)" value={form.rating_grade} onChange={(e) => updateField("rating_grade", e.target.value)} />
            </label>
          </div>
          <div className="space-y-2 border-2 border-dashed border-[#2d2d2d] bg-[#fdfbf7] p-3">
            <div className="inline-block border-2 border-[#2d2d2d] bg-[#fff9c4] px-2 py-1">NBFC-MFI</div>
            <div className="inline-block border-2 border-[#2d2d2d] bg-white px-2 py-1">Debt-listed</div>
            <div className="inline-block border-2 border-[#2d2d2d] bg-white px-2 py-1">Rated by CRISIL</div>
          </div>
        </div>
      ) : null}

      {activeTab === "Loan Details" ? (
        <div className="space-y-4">
          <div>
            <div className="mb-2">Loan Type</div>
            <div className="grid gap-2 md:grid-cols-4">
              {["Term Loan", "CC/OD", "NCD", "Co-lending"].map((loanType) => (
                <button
                  key={loanType}
                  type="button"
                  onClick={() => updateField("loan_type", loanType)}
                  className={`border-[3px] p-2 ${form.loan_type === loanType ? "bg-[#2d5da1] text-white" : "bg-white"}`}
                >
                  {loanType}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1">
              <span>Amount (INR Cr)</span>
              <input className="w-full border-2 border-[#2d2d2d] p-2" value={form.loan_amount_cr ?? ""} onChange={(e) => updateField("loan_amount_cr", toNumber(e.target.value))} />
            </label>
            <label className="space-y-1">
              <span>Tenure (Months)</span>
              <input className="w-full border-2 border-[#2d2d2d] p-2" value={form.tenure_months ?? ""} onChange={(e) => updateField("tenure_months", toNumber(e.target.value) as number | null)} />
            </label>
            <label className="space-y-1">
              <span>Proposed Rate (%)</span>
              <input className="w-full border-2 border-[#2d2d2d] p-2" value={form.proposed_rate_pct ?? ""} onChange={(e) => updateField("proposed_rate_pct", toNumber(e.target.value))} />
            </label>
          </div>
          <div className="text-sm">Suggested base: 1Y MCLR (9.05%) + risk premium</div>
          <div>
            <div className="mb-2">Security Type</div>
            <div className="flex flex-wrap gap-2">
              {["Exclusive", "Pari-passu", "Unsecured"].map((security) => (
                <button
                  key={security}
                  type="button"
                  onClick={() => updateField("security_type", security)}
                  className={`border-[3px] px-4 py-2 ${form.security_type === security ? "bg-[#ff4d4d] text-white" : "bg-white"}`}
                  style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                >
                  {security}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="sticky bottom-2 mt-8 flex items-center justify-between border-t-2 border-[#2d2d2d] bg-white pt-4">
        <button type="button" className="border-2 border-[#2d2d2d] px-4 py-2">
          Back
        </button>
        <div className="text-right">
          <button
            type="button"
            onClick={saveAndContinue}
            disabled={saving}
            className="border-[3px] border-[#2d2d2d] bg-[#2d5da1] px-5 py-2 text-white shadow-[4px_4px_0px_0px_#2d2d2d] disabled:opacity-50"
            style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
          >
            {saving ? "Saving..." : "Save & Continue"}
          </button>
          <div className="mt-1 text-xs">You can edit later</div>
        </div>
      </div>
    </section>
  );
}
