from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

DocStatus = Literal["pending", "uploading", "ready", "partial"]
ReviewState = Literal["not_started", "current", "completed", "pending_review"]


class EntityOnboarding(BaseModel):
    cin: str = ""
    pan: str = ""
    company_name: str = ""
    entity_type: str = ""
    sector: list[str] = Field(default_factory=list)
    incorporation_date: str = ""
    turnover_cr: float | None = None
    aum_cr: float | None = None
    net_worth_cr: float | None = None
    rating_agency: str = ""
    rating_grade: str = ""
    loan_type: str = ""
    loan_amount_cr: float | None = None
    tenure_months: int | None = None
    proposed_rate_pct: float | None = None
    security_type: str = ""


class DocumentItem(BaseModel):
    code: str
    label: str
    required: bool = True
    status: DocStatus = "pending"
    detected_type: str | None = None
    confidence: float | None = None
    filename: str | None = None
    review_note: str | None = None
    sample_url: str | None = None


class ResearchItem(BaseModel):
    id: str
    source: str
    date: str
    title: str
    summary: str
    risk: Literal["red", "amber", "green"]
    impact: str
    included_in_cam: bool = True


class CaseRecord(BaseModel):
    id: str
    entity_display: str
    user_display: str = "Amit - Senior Credit Manager"
    created_at: datetime
    updated_at: datetime
    step: int = 1
    step_state: dict[str, ReviewState] = Field(
        default_factory=lambda: {
            "onboarding": "current",
            "documents": "not_started",
            "extraction": "not_started",
            "risk_cam": "not_started",
        }
    )
    onboarding: EntityOnboarding = Field(default_factory=EntityOnboarding)
    documents: list[DocumentItem] = Field(default_factory=list)
    extraction_fields: dict[str, dict[str, list[dict]]] = Field(default_factory=dict)
    extraction_tasks: list[str] = Field(default_factory=list)
    research: list[ResearchItem] = Field(default_factory=list)
    qualitative_notes: str = ""
