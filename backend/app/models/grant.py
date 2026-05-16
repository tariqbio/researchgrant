import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Numeric, Date, Float, Text, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class Grant(Base):
    __tablename__ = "grants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Who added this grant
    source_id = Column(UUID(as_uuid=True), ForeignKey("sources.id"), nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    ingestion_job_id = Column(UUID(as_uuid=True), ForeignKey("ingestion_jobs.id"), nullable=True)

    # If published directly by a verified org (no pipeline needed)
    org_publisher_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Bilingual content
    title_en = Column(String, nullable=False)
    title_bn = Column(String, nullable=True)
    issuing_agency = Column(String, nullable=False)
    agency_type = Column(String, nullable=True)   # "government"|"university"|"ngo"|"private"

    # Dates
    deadline = Column(Date, nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Funding
    funding_min = Column(Numeric(15, 2), nullable=True)
    funding_max = Column(Numeric(15, 2), nullable=True)
    currency = Column(String, default="BDT")

    # Matching engine
    eligibility_types = Column(ARRAY(String), nullable=False, default=list)
    research_areas = Column(ARRAY(String), nullable=False, default=list)

    # Content
    description_en = Column(Text, nullable=True)
    description_bn = Column(Text, nullable=True)

    # Application config (set by org when publishing)
    requires_proposal_pdf = Column(Boolean, default=True)
    requires_cv = Column(Boolean, default=True)
    requires_budget_breakdown = Column(Boolean, default=True)
    application_instructions = Column(Text, nullable=True)
    max_budget_requested = Column(Numeric(15, 2), nullable=True)

    # Source
    source_url = Column(String, nullable=True)
    original_pdf_path = Column(String, nullable=True)

    # Status: pending_review → published → expired | rejected
    status = Column(String, nullable=False, default="pending_review", index=True)

    # AI quality
    ai_confidence_score = Column(Float, nullable=True)
    ai_extracted_fields = Column(JSONB, nullable=True)
    admin_note = Column(Text, nullable=True)

    # Relationships
    source = relationship("Source", back_populates="grants")
    org_publisher = relationship("User", foreign_keys=[org_publisher_id], back_populates="published_grants")
    watchlist_entries = relationship("Watchlist", back_populates="grant")
    alert_logs = relationship("AlertLog", back_populates="grant")
    ingestion_job = relationship("IngestionJob", back_populates="grant", uselist=False)
    applications = relationship("GrantApplication", back_populates="grant")
    research_projects = relationship("ResearchProject", back_populates="grant")
