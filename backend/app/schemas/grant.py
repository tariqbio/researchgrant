from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal


class GrantBase(BaseModel):
    title_en: str
    title_bn: Optional[str] = None
    issuing_agency: str
    agency_type: Optional[str] = None
    deadline: Optional[date] = None
    funding_min: Optional[Decimal] = None
    funding_max: Optional[Decimal] = None
    currency: str = "BDT"
    eligibility_types: List[str] = []
    research_areas: List[str] = []
    description_en: Optional[str] = None
    description_bn: Optional[str] = None
    source_url: Optional[str] = None


class GrantCreate(GrantBase):
    """Used by admin when creating a grant manually."""
    source_id: Optional[UUID] = None


class GrantUpdate(BaseModel):
    """Used on the review card — partial update."""
    title_en: Optional[str] = None
    title_bn: Optional[str] = None
    issuing_agency: Optional[str] = None
    deadline: Optional[date] = None
    funding_min: Optional[Decimal] = None
    funding_max: Optional[Decimal] = None
    eligibility_types: Optional[List[str]] = None
    research_areas: Optional[List[str]] = None
    description_en: Optional[str] = None
    description_bn: Optional[str] = None
    admin_note: Optional[str] = None


class GrantAdminAction(BaseModel):
    """Approve or reject from review queue."""
    action: str          # "approve" | "reject"
    edits: Optional[GrantUpdate] = None
    admin_note: Optional[str] = None


class GrantOut(GrantBase):
    id: UUID
    status: str
    ai_confidence_score: Optional[float]
    ai_extracted_fields: Optional[Dict[str, Any]] = None
    published_at: Optional[datetime]
    created_at: datetime
    days_until_deadline: Optional[int] = None
    is_watchlisted: Optional[bool] = None   # set per-user in response
    match_reasons: Optional[List[str]] = None  # which interests matched

    class Config:
        from_attributes = True


class GrantListResponse(BaseModel):
    items: List[GrantOut]
    total: int
    page: int
    page_size: int


class GrantSearchParams(BaseModel):
    query: Optional[str] = None
    research_areas: Optional[List[str]] = None
    eligibility_types: Optional[List[str]] = None
    deadline_within_days: Optional[int] = None
    funding_min: Optional[Decimal] = None
    funding_max: Optional[Decimal] = None
    agency: Optional[str] = None
    sort_by: str = "deadline"    # "deadline" | "created_at" | "funding_max"
    page: int = 1
    page_size: int = 20
