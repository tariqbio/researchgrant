from pydantic import BaseModel
from typing import Optional, Any, Dict
from uuid import UUID
from datetime import datetime


class IngestionJobOut(BaseModel):
    id: UUID
    source_id: Optional[UUID]
    raw_url: Optional[str]
    raw_file_path: Optional[str]
    ocr_engine: Optional[str]
    ocr_confidence: Optional[float]
    ai_model: Optional[str]
    ai_extracted_json: Optional[Dict[str, Any]]
    job_status: str
    failure_reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class CommunitySubmissionCreate(BaseModel):
    source_url: str
    notes: Optional[str] = None


class CommunitySubmissionOut(BaseModel):
    id: UUID
    source_url: str
    notes: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class SourceCreate(BaseModel):
    name: str
    url: Optional[str] = None
    source_type: str


class SourceOut(BaseModel):
    id: UUID
    name: str
    url: Optional[str]
    source_type: str
    is_active: bool
    last_checked_at: Optional[datetime]

    class Config:
        from_attributes = True
