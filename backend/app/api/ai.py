from fastapi import APIRouter

from app.config import settings

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/status")
def get_ai_status():
    return {
        "provider": "openrouter",
        "model": settings.openrouter_model,
        "configured": bool(settings.openrouter_api_key),
        "timeout_seconds": settings.llm_timeout_seconds,
        "max_retries": settings.llm_max_retries,
        "cache_ttl_seconds": settings.llm_cache_ttl_seconds,
    }
