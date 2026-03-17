"use client";

import { useParams } from "next/navigation";

import { CaseShellLoader } from "@/components/shared/case-shell-loader";
import { OnboardingScreen } from "@/components/screens/onboarding-screen";

export default function OnboardingPage() {
  const params = useParams<{ caseId: string }>();

  return (
    <CaseShellLoader caseId={params.caseId as string}>
      {(caseData, refresh) => <OnboardingScreen caseData={caseData} onSaved={refresh} />}
    </CaseShellLoader>
  );
}
