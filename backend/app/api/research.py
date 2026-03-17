from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.schemas.types import ResearchItem
from app.services.research_live import get_live_research
from app.services.store import store

router = APIRouter(prefix="/research", tags=["research"])


class ResearchTogglePayload(BaseModel):
    item_id: str
    include: bool


DEFAULT_ITEMS = [
    ResearchItem(
        id="rbi-circular-oct-2024",
        source="RBI",
        date="Oct 2024",
        title="RBI Co-lending Circular Tightens Risk Sharing Rules",
        summary="Updated circular increases risk retention obligations for participating lenders.",
        risk="amber",
        impact="Impact on entity: Higher capital requirement on co-lending book; risk premium +20 bps.",
        included_in_cam=True,
    ),
    ResearchItem(
        id="tn-flood-collections",
        source="Sector Watch",
        date="Dec 2025",
        title="Tamil Nadu Flood-Linked Collections Stress in Select Districts",
        summary="Localized disruption in rural collections can increase delinquency in affected clusters.",
        risk="amber",
        impact="Impact on entity: TN concentration risk observed; +25 bps suggested.",
        included_in_cam=True,
    ),
    ResearchItem(
        id="ecourts-no-major-hit",
        source="eCourts",
        date="Jan 2026",
        title="No major active litigation found in last 3 years",
        summary="Public records show no material active legal cases linked to the borrower entity.",
        risk="green",
        impact="Impact on entity: Governance and legal risk stable.",
        included_in_cam=True,
    ),
    ResearchItem(
        id="rbi-liquidity-framework",
        source="RBI",
        date="Nov 2025",
        title="Liquidity risk monitoring tightened for NBFCs with high growth",
        summary="Supervisory communication highlighted stronger ALM monitoring expectations for fast-growing NBFCs.",
        risk="amber",
        impact="Impact on entity: Reinforces quarterly ALM covenant and short-bucket monitoring.",
        included_in_cam=True,
    ),
    ResearchItem(
        id="sector-msme-demand",
        source="Industry Report",
        date="Feb 2026",
        title="MSME credit demand remains resilient in South India clusters",
        summary="Regional SME credit appetite stays strong, supporting disbursement growth in secured and small-ticket segments.",
        risk="green",
        impact="Impact on entity: Supports growth outlook and utilization assumptions.",
        included_in_cam=True,
    ),
]


@router.get("/{case_id}")
def get_research(case_id: str):
    case = store.get_case_or_default(case_id)

    # Try live external research first; keep deterministic fallback for reliability.
    if not case.research:
        try:
            live_items = get_live_research(case)
            case.research = live_items if live_items else DEFAULT_ITEMS
        except Exception:
            case.research = DEFAULT_ITEMS
        case.updated_at = datetime.utcnow()

    return case.research


@router.put("/{case_id}/toggle")
def toggle_research(case_id: str, payload: ResearchTogglePayload):
    case = store.cases.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    for item in case.research:
        if item.id == payload.item_id:
            item.included_in_cam = payload.include
            case.updated_at = datetime.utcnow()
            return item

    raise HTTPException(status_code=404, detail="Research item not found")
