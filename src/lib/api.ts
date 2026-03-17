import type { CaseRecord, DocumentItem, OnboardingData, RecommendationResponse, ResearchItem } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  getDefaultCase: () => request<CaseRecord>("/cases/default"),
  getCase: (caseId: string) => request<CaseRecord>(`/cases/${caseId}`),
  updateCase: (caseId: string, onboarding: OnboardingData, step: number) =>
    request<CaseRecord>(`/cases/${caseId}`, {
      method: "PUT",
      body: JSON.stringify({ onboarding, step }),
    }),
  getDocuments: (caseId: string) => request<DocumentItem[]>(`/documents/${caseId}`),
  updateDocument: (caseId: string, payload: Partial<DocumentItem> & { code: string; status: DocumentItem["status"] }) =>
    request<DocumentItem[]>(`/documents/${caseId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  getExtraction: (caseId: string) =>
    request<{ fields: Record<string, Record<string, Array<Record<string, unknown>>>>; tasks: string[] }>(`/extraction/${caseId}`),
  updateField: (caseId: string, payload: { tab: string; section: string; field_id: string; value: number | string }) =>
    request(`/extraction/${caseId}/field`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  getResearch: (caseId: string) => request<ResearchItem[]>(`/research/${caseId}`),
  toggleResearch: (caseId: string, item_id: string, include: boolean) =>
    request<ResearchItem>(`/research/${caseId}/toggle`, {
      method: "PUT",
      body: JSON.stringify({ item_id, include }),
    }),
  getRecommendation: (caseId: string) => request<RecommendationResponse>(`/recommendation/${caseId}`),
  getCamPreview: (caseId: string) => request<Record<string, unknown>>(`/cam/${caseId}/preview`),
};
