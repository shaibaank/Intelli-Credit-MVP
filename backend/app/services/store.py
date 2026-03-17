from datetime import datetime
from uuid import uuid4

from app.schemas.types import CaseRecord, DocumentItem


def default_documents() -> list[DocumentItem]:
    return [
        DocumentItem(
            code="annual_reports",
            label="Annual Reports (last 3 years)",
            sample_url="https://finance.kinaracapital.com/wp-content/uploads/2024/10/fy24-annual-report-kinara-capital.pdf",
        ),
        DocumentItem(
            code="alm_statement",
            label="ALM Statement",
            sample_url="https://www.tatacapital.com/content/dam/tata-capital/pdf/investors-and-financial-reports/annual-reports/24-25/tata-capital-limited.pdf",
        ),
        DocumentItem(
            code="shareholding",
            label="Shareholding Pattern",
            sample_url="https://moneyboxxfinance.com/annual-reports",
        ),
        DocumentItem(
            code="borrowing_profile",
            label="Borrowing Profile",
            sample_url="https://www.vivriticapital.com/annual-reports.html",
        ),
        DocumentItem(
            code="portfolio_performance",
            label="Portfolio Performance",
            sample_url="https://moneyboxxfinance.com/files/annual-report/1725368966.pdf",
        ),
    ]


class InMemoryStore:
    def __init__(self) -> None:
        self.cases: dict[str, CaseRecord] = {}

    def create_case(self) -> CaseRecord:
        case_id = str(uuid4())
        now = datetime.utcnow()
        case = CaseRecord(
            id=case_id,
            entity_display="Kinara Capital - INR 85 Cr Term Loan",
            created_at=now,
            updated_at=now,
            documents=default_documents(),
            onboarding={
                "cin": "U65910KA2011PTC061205",
                "pan": "AABCK1234L",
                "company_name": "Kinara Capital",
                "entity_type": "NBFC-MFI",
                "sector": ["NBFC", "MSME Lending"],
                "incorporation_date": "2011-11-14",
                "turnover_cr": 612.8,
                "aum_cr": 6342.0,
                "net_worth_cr": 1104.2,
                "rating_agency": "CRISIL",
                "rating_grade": "CRISIL A- (Stable)",
                "loan_type": "Term Loan",
                "loan_amount_cr": 85,
                "tenure_months": 60,
                "proposed_rate_pct": 11.2,
                "security_type": "Pari-passu",
            },
            extraction_fields={
                "financials": {
                    "income_statement": [
                        {
                            "id": "pat_fy24",
                            "label": "PAT (INR Cr)",
                            "value": 52.3,
                            "status": "ok",
                            "badge": "Extracted - Pg 84",
                            "source_page": 84,
                            "confidence": 0.93,
                        },
                        {
                            "id": "revenue_fy24",
                            "label": "Revenue (INR Cr)",
                            "value": 612.8,
                            "status": "ok",
                            "badge": "Extracted - Pg 82",
                            "source_page": 82,
                            "confidence": 0.95,
                        },
                        {
                            "id": "dscr",
                            "label": "DSCR",
                            "value": 1.42,
                            "status": "ok",
                            "badge": "Computed - Formula",
                            "formula": "(PAT + Depreciation) / Debt Service",
                            "confidence": 1.0,
                        },
                    ],
                    "asset_quality": [
                        {
                            "id": "gnpa",
                            "label": "GNPA (%)",
                            "value": 1.8,
                            "status": "ok",
                            "badge": "Extracted - Pg 91",
                            "source_page": 91,
                            "confidence": 0.89,
                        },
                        {
                            "id": "nnpa",
                            "label": "NNPA (%)",
                            "value": 0.9,
                            "status": "warning",
                            "badge": "Extracted - Pg 91",
                            "source_page": 91,
                            "confidence": 0.69,
                        },
                        {
                            "id": "crar",
                            "label": "CRAR (%)",
                            "value": 18.7,
                            "status": "ok",
                            "badge": "Extracted - Pg 90",
                            "source_page": 90,
                            "confidence": 0.9,
                        },
                    ],
                    "balance_sheet": [
                        {
                            "id": "net_worth",
                            "label": "Net Worth (INR Cr)",
                            "value": 1104.2,
                            "status": "ok",
                            "badge": "Extracted - Pg 86",
                            "source_page": 86,
                            "confidence": 0.94,
                        },
                        {
                            "id": "total_borrowings",
                            "label": "Total Borrowings (INR Cr)",
                            "value": 4230.6,
                            "status": "ok",
                            "badge": "Extracted - Pg 87",
                            "source_page": 87,
                            "confidence": 0.92,
                        },
                    ],
                },
                "alm": {
                    "liquidity_buckets": [
                        {
                            "id": "alm_0_30",
                            "label": "0-30 Days Gap (INR Cr)",
                            "value": -42.3,
                            "status": "warning",
                            "badge": "Extracted - ALM Sheet",
                            "confidence": 0.68,
                        },
                        {
                            "id": "alm_1_3m",
                            "label": "1-3 Months Gap (INR Cr)",
                            "value": 55.1,
                            "status": "ok",
                            "badge": "Extracted - ALM Sheet",
                            "confidence": 0.88,
                        },
                    ]
                },
                "shareholding": {
                    "ownership": [
                        {
                            "id": "promoter_holding",
                            "label": "Promoter Holding (%)",
                            "value": 52.4,
                            "status": "ok",
                            "badge": "Extracted - Shareholding",
                            "confidence": 0.9,
                        },
                        {
                            "id": "institutional_holding",
                            "label": "Institutional Holding (%)",
                            "value": 38.6,
                            "status": "ok",
                            "badge": "Extracted - Shareholding",
                            "confidence": 0.87,
                        },
                    ]
                },
                "borrowings": {
                    "lender_mix": [
                        {
                            "id": "bank_borrowings",
                            "label": "Bank Borrowings Share (%)",
                            "value": 63.0,
                            "status": "ok",
                            "badge": "Extracted - Borrowing Profile",
                            "confidence": 0.91,
                        },
                        {
                            "id": "ncd_share",
                            "label": "NCD Share (%)",
                            "value": 17.5,
                            "status": "ok",
                            "badge": "Extracted - Borrowing Profile",
                            "confidence": 0.86,
                        },
                    ]
                },
                "portfolio": {
                    "performance": [
                        {
                            "id": "collection_efficiency",
                            "label": "Collection Efficiency (%)",
                            "value": 97.6,
                            "status": "ok",
                            "badge": "Extracted - Portfolio Cut",
                            "confidence": 0.9,
                        },
                        {
                            "id": "co_lending_ratio",
                            "label": "Co-lending Ratio (% of AUM)",
                            "value": 36.2,
                            "status": "warning",
                            "badge": "Computed - Formula",
                            "formula": "Co-lending book / total AUM",
                            "confidence": 1.0,
                        },
                    ],
                }
            },
            extraction_tasks=[
                "2 tables have low confidence. Review ALM bucket 5-7 years.",
                "3 fields need manual confirmation before CAM finalization.",
                "Validate promoter shareholding delta against prior quarter filing.",
            ],
            research=[],
            qualitative_notes="Factory visit in Hosur indicates 40% temporary capacity utilization due to expansion block commissioning.",
        )
        self.cases[case_id] = case
        return case

    def get_or_create_default(self) -> CaseRecord:
        if not self.cases:
            return self.create_case()
        return next(iter(self.cases.values()))

    def get_case_or_default(self, case_id: str) -> CaseRecord:
        case = self.cases.get(case_id)
        if case:
            return case
        return self.get_or_create_default()


store = InMemoryStore()
