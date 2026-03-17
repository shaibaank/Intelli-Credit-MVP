from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _load_dotenv() -> None:
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def _to_float(value: str | None, default: float) -> float:
    try:
        return float(value) if value is not None else default
    except ValueError:
        return default


def _to_int(value: str | None, default: int) -> int:
    try:
        return int(value) if value is not None else default
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    openrouter_api_key: str
    openrouter_model: str
    llm_timeout_seconds: float
    llm_max_retries: int
    llm_cache_ttl_seconds: int

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            openrouter_api_key=os.getenv("OPENROUTER_API_KEY", "").strip(),
            openrouter_model=os.getenv("OPENROUTER_MODEL", "openrouter/auto").strip() or "openrouter/auto",
            llm_timeout_seconds=_to_float(os.getenv("LLM_TIMEOUT_SECONDS"), 20.0),
            llm_max_retries=max(_to_int(os.getenv("LLM_MAX_RETRIES"), 1), 0),
            llm_cache_ttl_seconds=max(_to_int(os.getenv("LLM_CACHE_TTL_SECONDS"), 600), 0),
        )


_load_dotenv()
settings = Settings.from_env()
