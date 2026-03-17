from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.store import store

router = APIRouter(prefix="/extraction", tags=["extraction"])


class FieldEditPayload(BaseModel):
    tab: str
    section: str
    field_id: str
    value: float | str


@router.get("/{case_id}")
def get_extraction(case_id: str):
    case = store.get_case_or_default(case_id)
    return {
        "fields": case.extraction_fields,
        "tasks": case.extraction_tasks,
    }


@router.put("/{case_id}/field")
def update_field(case_id: str, payload: FieldEditPayload):
    case = store.cases.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    rows = case.extraction_fields.get(payload.tab, {}).get(payload.section, [])
    for row in rows:
        if row["id"] == payload.field_id:
            row["value"] = payload.value
            row["edited_by"] = "You"
            row["edited_at"] = datetime.utcnow().strftime("%I:%M %p")
            case.updated_at = datetime.utcnow()
            case.step_state["extraction"] = "pending_review"
            case.step_state["risk_cam"] = "current"
            return row

    raise HTTPException(status_code=404, detail="Field not found")
