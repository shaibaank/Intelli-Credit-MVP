from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.services.store import store

router = APIRouter(prefix="/cam", tags=["cam"])


def _preview_payload(case_id: str) -> dict:
    return {
        "sections": [
            {
                "title": "Facility Summary",
                "content": "Proposed INR 85 Cr term loan for 60 months at recommended 11.25% linked to MCLR plus calibrated risk premium.",
            },
            {
                "title": "Borrower Overview",
                "content": "Kinara Capital is an NBFC focused on MSME lending with strong regional franchise and consistent collections discipline.",
            },
            {
                "title": "Financial Analysis",
                "content": "Revenue growth, PAT momentum, DSCR 1.42x, and CRAR 18.7% support repayment capacity; short-bucket ALM requires active monitoring.",
            },
            {
                "title": "Risk Assessment (5 Cs)",
                "content": "Character and governance are stable, capacity is strong, capital adequacy is comfortable, collateral is acceptable, and conditions are manageable with covenants.",
            },
            {
                "title": "Covenants & Conditions",
                "content": "Enforce DSCR floor, co-lending cap, and quarterly ALM compliance certification with lender information rights.",
            },
            {
                "title": "Final Recommendation",
                "content": "Conditional approve with risk-adjusted pricing and quarterly covenant monitoring due to regulatory and concentration overlays.",
            },
        ],
        "trace": "DSCR 1.42x derived from extracted FY24 statements in Extraction tab.",
        "generated_at": datetime.now(UTC).replace(microsecond=0).isoformat(),
        "template": "Standard NBFC",
        "case_id": case_id,
    }


def _build_word_html(payload: dict) -> str:
    sections = payload["sections"]
    lines = [
        "<html><head><meta charset='utf-8'><title>Credit Assessment Memo</title></head><body>",
        "<h1>Credit Assessment Memo</h1>",
        f"<p><b>Case ID:</b> {payload['case_id']}</p>",
        f"<p><b>Template:</b> {payload['template']}</p>",
        f"<p><b>Generated:</b> {payload['generated_at']}</p>",
        "<hr />",
    ]
    for section in sections:
        lines.append(f"<h2>{section['title']}</h2>")
        lines.append(f"<p>{section['content']}</p>")
    lines.append(f"<p><b>Trace:</b> {payload['trace']}</p>")
    lines.append("</body></html>")
    return "\n".join(lines)


def _escape_pdf_text(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _build_simple_pdf(payload: dict) -> bytes:
    lines: list[str] = [
        "Credit Assessment Memo",
        f"Case ID: {payload['case_id']}",
        f"Template: {payload['template']}",
        f"Generated: {payload['generated_at']}",
        "",
    ]
    for section in payload["sections"]:
        lines.append(section["title"])
        lines.append(section["content"])
        lines.append("")
    lines.append(f"Trace: {payload['trace']}")

    content_lines = ["BT", "/F1 11 Tf", "14 TL", "40 800 Td"]
    for line in lines[:45]:
        content_lines.append(f"({_escape_pdf_text(line[:120])}) Tj")
        content_lines.append("T*")
    content_lines.append("ET")
    stream = "\n".join(content_lines).encode("ascii", errors="ignore")

    objects: list[bytes] = []
    objects.append(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
    objects.append(b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")
    objects.append(
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n"
    )
    objects.append(b"4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")
    objects.append(
        b"5 0 obj\n<< /Length " + str(len(stream)).encode("ascii") + b" >>\nstream\n" + stream + b"\nendstream\nendobj\n"
    )

    header = b"%PDF-1.4\n"
    body = bytearray(header)
    offsets = [0]
    for obj in objects:
        offsets.append(len(body))
        body.extend(obj)

    xref_start = len(body)
    body.extend(f"xref\n0 {len(offsets)}\n".encode("ascii"))
    body.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        body.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    body.extend(
        f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF".encode("ascii")
    )
    return bytes(body)


@router.get("/{case_id}/preview")
def cam_preview(case_id: str):
    case = store.get_case_or_default(case_id)

    return _preview_payload(case.id)


@router.get("/{case_id}/download/word")
def cam_download_word(case_id: str):
    case = store.get_case_or_default(case_id)

    payload = _preview_payload(case.id)
    html = _build_word_html(payload)
    filename = f"cam-{case.id}.doc"
    return Response(
        content=html.encode("utf-8"),
        media_type="application/msword",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{case_id}/download/pdf")
def cam_download_pdf(case_id: str):
    case = store.get_case_or_default(case_id)

    payload = _preview_payload(case.id)
    pdf_bytes = _build_simple_pdf(payload)
    filename = f"cam-{case.id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
