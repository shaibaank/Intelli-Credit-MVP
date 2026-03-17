from fastapi import APIRouter, HTTPException

from app.services.llm_service import generate_reasoning
from app.services.store import store

router = APIRouter(prefix="/recommendation", tags=["recommendation"])


@router.get("/{case_id}")
def get_recommendation(case_id: str):
    case = store.get_case_or_default(case_id)

    if not case.research:
        case.research = []

    included = [item for item in case.research if item.included_in_cam]
    reg_penalty = 0.20 if any("circular" in i.title.lower() for i in included) else 0.0
    geo_penalty = 0.25 if any("tamil nadu" in i.title.lower() for i in included) else 0.0
    liquidity_penalty = 0.10 if any("liquidity" in i.title.lower() for i in included) else 0.0

    base = 9.05
    risk_premium = 1.65 + reg_penalty + geo_penalty + liquidity_penalty
    final_rate = round(base + risk_premium, 2)
    score = 71 - int((reg_penalty + geo_penalty + liquidity_penalty) * 10)
    score = max(score, 62)
    tag = "Conditional Approve" if score < 75 else "Approve"

    recommendation_payload = {
        "score": score,
        "tag": tag,
        "recommendation": "Approve INR 85 Cr",
        "rate": {
            "base_rate": base,
            "credit_risk_premium": 1.65,
            "tn_concentration_risk": geo_penalty,
            "regulatory_risk": reg_penalty,
            "liquidity_risk": liquidity_penalty,
            "final_recommended_rate": final_rate,
        },
        "breakdown": [
            {
                "factor": "Financial Health",
                "score": "78/100",
                "points": "+23.4 pts",
                "why": "Revenue growth and PAT trend are strong.",
            },
            {
                "factor": "Asset Quality",
                "score": "82/100",
                "points": "+20.5 pts",
                "why": "GNPA 1.8%, NNPA 0.9%, CRAR 18.7% indicate healthy controls.",
            },
            {
                "factor": "Management & Governance",
                "score": "75/100",
                "points": "+15.0 pts",
                "why": "No major active litigation found in sampled public records.",
            },
            {
                "factor": "External Risk",
                "score": "55/100",
                "points": "+8.3 pts",
                "why": "Sector and regulatory headwinds elevate risk premium.",
            },
            {
                "factor": "Collateral",
                "score": "60/100",
                "points": "+6.0 pts",
                "why": "Security is acceptable but not fully exclusive.",
            },
        ],
        "covenants": [
            {"text": "TN AUM concentration <= 35%", "tag": "Geo Risk"},
            {"text": "Co-lending ratio <= 40% of AUM", "tag": "Reg Risk"},
            {"text": "DSCR >= 1.25x quarterly", "tag": "Financial"},
            {"text": "ALM cumulative mismatch (1-30 days) within board-approved threshold", "tag": "Liquidity"},
        ],
        "swot": {
            "strengths": [
                "Healthy asset quality and strong collection efficiency",
                "Diversified lender relationships and stable rating outlook",
            ],
            "weaknesses": [
                "Short-term ALM gap needs monitoring",
                "Regional concentration in Tamil Nadu book",
            ],
            "opportunities": [
                "MSME formalization tailwind can improve credit penetration",
                "Co-lending partnerships can optimize cost of funds",
            ],
            "threats": [
                "Evolving RBI compliance expectations",
                "Weather-linked collection disruptions in key geographies",
            ],
        },
    }

    llm_context = {
        "entity": case.entity_display,
        "onboarding": case.onboarding.model_dump(),
        "research": [item.model_dump() for item in included],
        "qualitative_notes": case.qualitative_notes,
        "score": score,
        "rate": recommendation_payload["rate"],
        "breakdown": recommendation_payload["breakdown"],
        "covenants": recommendation_payload["covenants"],
    }

    recommendation_payload["llm_reasoning"] = generate_reasoning(case_id=case_id, context=llm_context)

    return recommendation_payload
