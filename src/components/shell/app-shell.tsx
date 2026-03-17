"use client";

import { usePathname } from "next/navigation";

import { Stepper } from "@/components/shell/stepper";
import { Sidebar } from "@/components/shell/sidebar";
import type { CaseRecord } from "@/lib/types";

export function AppShell({ caseData, children }: { caseData: CaseRecord; children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#2d2d2d]">
      <div className="flex">
        <Sidebar caseId={caseData.id} path={path} />
        <div className="flex-1">
          <header className="sticky top-0 z-20 border-b-[3px] border-[#2d2d2d] bg-[#fdfbf7] p-4">
            <div className="grid gap-4 md:grid-cols-[1fr_2fr_1fr] md:items-center">
              <div className="text-lg font-bold">Intelli-Credit - NBFC Credit Underwriting</div>
              <Stepper caseId={caseData.id} stepState={caseData.step_state} />
              <div className="justify-self-end text-right text-sm">
                <div className="inline-block border-2 border-[#2d2d2d] bg-white px-3 py-1" style={{ borderRadius: "20px 80px 30px 70px / 70px 30px 80px 20px" }}>
                  {caseData.entity_display}
                </div>
                <div className="mt-2">{caseData.user_display}</div>
              </div>
            </div>
          </header>
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
