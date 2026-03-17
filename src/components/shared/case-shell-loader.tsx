"use client";

import { useCallback, useEffect, useState } from "react";

import { AppShell } from "@/components/shell/app-shell";
import { api } from "@/lib/api";
import type { CaseRecord } from "@/lib/types";

export function CaseShellLoader({
  caseId,
  children,
}: {
  caseId: string;
  children: (caseData: CaseRecord, refresh: () => Promise<void>) => React.ReactNode;
}) {
  const [caseData, setCaseData] = useState<CaseRecord | null>(null);

  const refresh = useCallback(async () => {
    const payload = await api.getCase(caseId);
    setCaseData(payload);
  }, [caseId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!caseData) {
    return <div className="min-h-screen p-8">Loading case shell...</div>;
  }

  return <AppShell caseData={caseData}>{children(caseData, refresh)}</AppShell>;
}
