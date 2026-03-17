"use client";

import { useParams } from "next/navigation";

import { CaseShellLoader } from "@/components/shared/case-shell-loader";
import { ExtractionScreen } from "@/components/screens/extraction-screen";

export default function ExtractionPage() {
  const params = useParams<{ caseId: string }>();

  return (
    <CaseShellLoader caseId={params.caseId as string}>
      {(caseData) => <ExtractionScreen caseId={caseData.id} />}
    </CaseShellLoader>
  );
}
