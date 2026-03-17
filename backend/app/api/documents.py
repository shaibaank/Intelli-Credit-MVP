from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.schemas.types import DocStatus
from app.services.store import store

router = APIRouter(prefix="/documents", tags=["documents"])


class DocumentUpdatePayload(BaseModel):
    code: str
    status: DocStatus
    filename: str | None = None
    detected_type: str | None = None
    confidence: float | None = None
    review_note: str | None = None


@router.get("/{case_id}")
def get_documents(case_id: str):
    case = store.get_case_or_default(case_id)
    return case.documents


@router.put("/{case_id}")
def update_document(case_id: str, payload: DocumentUpdatePayload):
    case = store.cases.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    for doc in case.documents:
        if doc.code == payload.code:
            doc.status = payload.status
            doc.filename = payload.filename or doc.filename
            doc.detected_type = payload.detected_type or doc.detected_type
            doc.confidence = payload.confidence or doc.confidence
            doc.review_note = payload.review_note
            case.updated_at = datetime.utcnow()
            break
    else:
        raise HTTPException(status_code=404, detail="Document type not found")

    all_done = all(d.status in {"ready", "partial"} for d in case.documents if d.required)
    if all_done:
        case.step_state["documents"] = "completed"
        case.step_state["extraction"] = "current"

    return case.documents
