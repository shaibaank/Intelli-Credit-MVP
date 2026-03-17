"use client";

import { useParams } from "next/navigation";

import { CaseShellLoader } from "@/components/shared/case-shell-loader";
import { DocumentsScreen } from "@/components/screens/documents-screen";

export default function DocumentsPage() {
  const params = useParams<{ caseId: string }>();

  return (
    <CaseShellLoader caseId={params.caseId as string}>
      {(caseData) => <DocumentsScreen caseId={caseData.id} />}
    </CaseShellLoader>
  );
}
