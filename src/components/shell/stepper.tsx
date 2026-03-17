"use client";

import type { ReviewState, StepKey } from "@/lib/types";
import Link from "next/link";

const orderedSteps: Array<{ key: StepKey; label: string; href: string }> = [
  { key: "onboarding", label: "Onboarding", href: "onboarding" },
  { key: "documents", label: "Documents", href: "documents" },
  { key: "extraction", label: "Extraction", href: "extraction" },
  { key: "risk_cam", label: "Risk & CAM", href: "risk-cam" },
];

function stateClass(state: ReviewState): string {
  if (state === "completed") return "bg-green-500 text-white border-[#2d2d2d]";
  if (state === "current") return "bg-[#2d5da1] text-white border-[#2d2d2d]";
  if (state === "pending_review") return "bg-[#ff4d4d] text-white border-[#2d2d2d]";
  return "bg-[#e5e0d8] text-[#2d2d2d] border-[#2d2d2d]";
}

export function Stepper({
  caseId,
  stepState,
}: {
  caseId: string;
  stepState: Record<StepKey, ReviewState>;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {orderedSteps.map((step) => {
        const state = stepState[step.key];
        return (
          <Link
            key={step.key}
            href={`/case/${caseId}/${step.href}`}
            className={`border-[3px] px-3 py-1 text-sm shadow-[3px_3px_0px_0px_#2d2d2d] transition-transform hover:-translate-y-0.5 ${stateClass(state)}`}
            style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
          >
            {step.label}
            {state === "pending_review" ? <span className="ml-2 inline-block h-2 w-2 rounded-full bg-yellow-200" /> : null}
          </Link>
        );
      })}
    </div>
  );
}
