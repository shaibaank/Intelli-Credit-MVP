from __future__ import annotations

from datetime import UTC, datetime
import hashlib
import json
import time
from typing import Any

import httpx

from app.config import settings

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}


def _now_iso() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat()


def _extract_json(text: str) -> dict[str, Any]:
    payload = text.strip()
    if payload.startswith("```"):
        lines = payload.splitlines()
        if len(lines) >= 3:
            payload = "\n".join(lines[1:-1]).strip()
    return json.loads(payload)


def _cache_key(case_id: str, context: dict[str, Any]) -> str:
    digest = hashlib.sha256(json.dumps(context, sort_keys=True, default=str).encode("utf-8")).hexdigest()
    return f"{case_id}:{settings.openrouter_model}:{digest}"


def _read_cache(key: str) -> dict[str, Any] | None:
    if settings.llm_cache_ttl_seconds <= 0:
        return None
    item = _CACHE.get(key)
    if item is None:
        return None
    expires_at, value = item
    if time.time() > expires_at:
        _CACHE.pop(key, None)
        return None
    return value


def _write_cache(key: str, value: dict[str, Any]) -> None:
    if settings.llm_cache_ttl_seconds <= 0:
        return
    _CACHE[key] = (time.time() + settings.llm_cache_ttl_seconds, value)


def build_fallback_reasoning(context: dict[str, Any], reason: str) -> dict[str, Any]:
    included_titles = [item.get("title", "") for item in context.get("research", [])]
    return {
        "methodology": "Fallback deterministic underwriting narrative generated from extracted financials and selected research signals.",
        "key_risks": [
            "Regional concentration and external sector volatility require tighter monitoring.",
            "Regulatory and liquidity overlays remain elevated for fast-growth NBFC portfolios.",
        ],
        "mitigants": [
            "Current asset quality indicators remain within acceptable thresholds.",
            "Covenant package includes DSCR, ALM, and concentration guardrails.",
        ],
        "pricing_logic": f"Final pricing blends base rate and deterministic overlays; selected themes: {', '.join(included_titles[:3]) or 'none'}.",
        "covenant_rationale": {
            "TN AUM concentration <= 35%": "Limits geographic concentration risk.",
            "Co-lending ratio <= 40% of AUM": "Caps exposure to partnership structure shifts.",
            "DSCR >= 1.25x quarterly": "Protects debt service coverage under stress.",
        },
        "confidence": 0.66,
        "generated_at": _now_iso(),
        "source": "fallback",
        "fallback_reason": reason,
    }


def _prompt_messages(context: dict[str, Any]) -> list[dict[str, str]]:
    system_prompt = (
        "You are a senior NBFC credit analyst. "
        "Return STRICT JSON only with keys: methodology, key_risks, mitigants, pricing_logic, covenant_rationale, confidence. "
        "Do not include markdown fences or extra keys. confidence must be between 0 and 1."
    )
    user_prompt = (
        "Create a detailed but concise underwriting reasoning block for this case context:\n"
        f"{json.dumps(context, ensure_ascii=True, default=str)}"
    )
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]


def generate_reasoning(case_id: str, context: dict[str, Any]) -> dict[str, Any]:
    key = _cache_key(case_id, context)
    cached = _read_cache(key)
    if cached is not None:
        return cached

    if not settings.openrouter_api_key:
        fallback = build_fallback_reasoning(context, "OPENROUTER_API_KEY not configured")
        _write_cache(key, fallback)
        return fallback

    payload = {
        "model": settings.openrouter_model,
        "messages": _prompt_messages(context),
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
    }

    attempts = settings.llm_max_retries + 1
    for _ in range(attempts):
        try:
            with httpx.Client(timeout=settings.llm_timeout_seconds) as client:
                response = client.post(OPENROUTER_URL, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
            content = data["choices"][0]["message"]["content"]
            parsed = _extract_json(content)
            result = {
                "methodology": str(parsed.get("methodology", "")),
                "key_risks": [str(item) for item in parsed.get("key_risks", [])][:6],
                "mitigants": [str(item) for item in parsed.get("mitigants", [])][:6],
                "pricing_logic": str(parsed.get("pricing_logic", "")),
                "covenant_rationale": {
                    str(k): str(v) for k, v in dict(parsed.get("covenant_rationale", {})).items()
                },
                "confidence": float(parsed.get("confidence", 0.75)),
                "generated_at": _now_iso(),
                "source": "live",
            }
            _write_cache(key, result)
            return result
        except Exception:
            continue

    fallback = build_fallback_reasoning(context, "OpenRouter request failed after retries")
    _write_cache(key, fallback)
    return fallback
