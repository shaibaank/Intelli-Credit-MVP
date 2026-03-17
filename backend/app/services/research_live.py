from __future__ import annotations

from datetime import UTC, datetime
import hashlib
import html
import re
import time
from typing import Iterable
from urllib.parse import quote_plus
import xml.etree.ElementTree as ET

import httpx

from app.schemas.types import CaseRecord, ResearchItem

_CACHE: dict[str, tuple[float, list[ResearchItem]]] = {}
_CACHE_TTL_SECONDS = 900


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def _strip_html(value: str) -> str:
    text = re.sub(r"<[^>]+>", " ", value)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _risk_from_text(text: str) -> str:
    t = text.lower()
    if any(k in t for k in ["fraud", "default", "npa spike", "probe", "penalty", "litigation", "downgrade"]):
        return "red"
    if any(k in t for k in ["rbi", "regulatory", "liquidity", "collections", "flood", "stress", "slowdown", "inflation"]):
        return "amber"
    return "green"


def _impact_from_risk(risk: str, title: str) -> str:
    if risk == "red":
        return f"Impact on entity: Material adverse signal from '{title[:80]}'. Tighten covenants and re-evaluate pricing."
    if risk == "amber":
        return f"Impact on entity: Watchlist signal from '{title[:80]}'. Apply monitoring overlay and periodic review."
    return f"Impact on entity: Supportive or neutral signal from '{title[:80]}'."


def _parse_items(xml_text: str) -> Iterable[dict[str, str]]:
    root = ET.fromstring(xml_text)
    for item in root.findall(".//item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pub_date = (item.findtext("pubDate") or "").strip()
        description = (item.findtext("description") or "").strip()
        source = (item.findtext("source") or "Google News").strip()
        if not title:
            continue
        yield {
            "title": title,
            "link": link,
            "pub_date": pub_date,
            "description": _strip_html(description),
            "source": source,
        }


def _build_queries(case: CaseRecord) -> list[str]:
    company = case.onboarding.company_name.strip() or case.entity_display.split("-")[0].strip()
    sector_hint = " ".join(case.onboarding.sector[:2]) if case.onboarding.sector else "NBFC"
    queries = [
        f"{company} RBI NBFC India",
        f"{company} collections asset quality",
        f"{sector_hint} India regulatory update",
    ]
    return queries


def _cache_key(case: CaseRecord) -> str:
    seed = f"{case.id}:{case.onboarding.company_name}:{case.onboarding.entity_type}:{','.join(case.onboarding.sector)}"
    return hashlib.sha256(seed.encode("utf-8")).hexdigest()


def get_live_research(case: CaseRecord) -> list[ResearchItem]:
    key = _cache_key(case)
    cached = _CACHE.get(key)
    if cached is not None and time.time() < cached[0]:
        return cached[1]

    queries = _build_queries(case)
    urls = [
        f"https://news.google.com/rss/search?q={quote_plus(q)}&hl=en-IN&gl=IN&ceid=IN:en"
        for q in queries
    ]

    collected: dict[str, ResearchItem] = {}
    with httpx.Client(timeout=8.0, follow_redirects=True) as client:
        for url in urls:
            response = client.get(url)
            response.raise_for_status()
            for row in _parse_items(response.text):
                uid_seed = f"{row['title']}|{row['link']}"
                uid = hashlib.sha1(uid_seed.encode("utf-8")).hexdigest()[:14]
                item_id = f"live-{uid}"
                if item_id in collected:
                    continue
                risk = _risk_from_text(f"{row['title']} {row['description']}")
                summary = row["description"][:220] if row["description"] else row["title"]
                item = ResearchItem(
                    id=item_id,
                    source=row["source"] or "Google News",
                    date=row["pub_date"][:16] if row["pub_date"] else datetime.now(UTC).strftime("%d %b %Y"),
                    title=row["title"][:140],
                    summary=summary,
                    risk=risk,
                    impact=_impact_from_risk(risk, row["title"]),
                    included_in_cam=True,
                )
                collected[item_id] = item
                if len(collected) >= 8:
                    break
            if len(collected) >= 8:
                break

    # Prioritize higher-risk items first for analyst workflow.
    priority = {"red": 0, "amber": 1, "green": 2}
    items = sorted(collected.values(), key=lambda x: (priority[x.risk], x.date))[:5]
    _CACHE[key] = (time.time() + _CACHE_TTL_SECONDS, items)
    return items
