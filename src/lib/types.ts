export type ReviewState = "not_started" | "current" | "completed" | "pending_review";

export type StepKey = "onboarding" | "documents" | "extraction" | "risk_cam";

export type OnboardingData = {
  cin: string;
  pan: string;
  company_name: string;
  entity_type: string;
  sector: string[];
  incorporation_date: string;
  turnover_cr: number | null;
  aum_cr: number | null;
  net_worth_cr: number | null;
  rating_agency: string;
  rating_grade: string;
  loan_type: string;
  loan_amount_cr: number | null;
  tenure_months: number | null;
  proposed_rate_pct: number | null;
  security_type: string;
};

export type DocumentItem = {
  code: string;
  label: string;
  required: boolean;
  status: "pending" | "uploading" | "ready" | "partial";
  detected_type?: string;
  confidence?: number;
  filename?: string;
  review_note?: string;
  sample_url?: string;
};

export type CaseRecord = {
  id: string;
  entity_display: string;
  user_display: string;
  step_state: Record<StepKey, ReviewState>;
  onboarding: OnboardingData;
};

export type ResearchItem = {
  id: string;
  source: string;
  date: string;
  title: string;
  summary: string;
  risk: "red" | "amber" | "green";
  impact: string;
  included_in_cam: boolean;
};

export type LlmReasoning = {
  methodology: string;
  key_risks: string[];
  mitigants: string[];
  pricing_logic: string;
  covenant_rationale: Record<string, string>;
  confidence: number;
  generated_at: string;
  source: "live" | "fallback";
  fallback_reason?: string;
};

export type RecommendationResponse = {
  score: number;
  tag: string;
  recommendation: string;
  rate: {
    base_rate: number;
    credit_risk_premium: number;
    tn_concentration_risk: number;
    regulatory_risk: number;
    liquidity_risk: number;
    final_recommended_rate: number;
  };
  breakdown: Array<{ factor: string; score: string; points: string; why: string }>;
  covenants: Array<{ text: string; tag: string }>;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  llm_reasoning?: LlmReasoning;
};
