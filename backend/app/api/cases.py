from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.schemas.types import EntityOnboarding
from app.services.store import store

router = APIRouter(prefix="/cases", tags=["cases"])


class CaseUpdatePayload(BaseModel):
    onboarding: EntityOnboarding
    step: int


@router.post("")
def create_case():
    return store.create_case()


@router.get("/default")
def get_default_case():
    return store.get_or_create_default()


@router.get("/{case_id}")
def get_case(case_id: str):
    case = store.get_case_or_default(case_id)
    return case


@router.put("/{case_id}")
def update_case(case_id: str, payload: CaseUpdatePayload):
    case = store.cases.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case.onboarding = payload.onboarding
    case.step = payload.step
    case.entity_display = (
        f"{payload.onboarding.company_name or 'Unnamed Entity'} - INR {payload.onboarding.loan_amount_cr or 0} Cr {payload.onboarding.loan_type or 'Loan'}"
    )
    case.updated_at = datetime.utcnow()

    if payload.step >= 2:
        case.step_state["onboarding"] = "completed"
        case.step_state["documents"] = "current"

    return case
