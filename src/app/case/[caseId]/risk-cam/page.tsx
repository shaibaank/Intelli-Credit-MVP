"use client";

import { useParams, useSearchParams } from "next/navigation";

import { CaseShellLoader } from "@/components/shared/case-shell-loader";
import { RiskCamScreen } from "@/components/screens/risk-cam-screen";

export default function RiskCamPage() {
  const params = useParams<{ caseId: string }>();
  const search = useSearchParams();
  const tab = search.get("tab") ?? undefined;

  return (
    <CaseShellLoader caseId={params.caseId as string}>
      {(caseData) => <RiskCamScreen caseId={caseData.id} initialTab={tab ?? undefined} />}
    </CaseShellLoader>
  );
}
