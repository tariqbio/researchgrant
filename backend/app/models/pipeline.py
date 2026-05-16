import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class Source(Base):
    __tablename__ = "sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    url = Column(String, nullable=True)
    source_type = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    last_checked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    grants = relationship("Grant", back_populates="source")
    ingestion_jobs = relationship("IngestionJob", back_populates="source")


class IngestionJob(Base):
    __tablename__ = "ingestion_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id = Column(UUID(as_uuid=True), ForeignKey("sources.id"), nullable=True)
    raw_file_path = Column(String, nullable=True)
    raw_url = Column(String, nullable=True)
    raw_text_path = Column(String, nullable=True)
    ocr_engine = Column(String, nullable=True)
    ocr_confidence = Column(Float, nullable=True)
    ai_model = Column(String, nullable=True)
    ai_extracted_json = Column(JSONB, nullable=True)
    job_status = Column(String, nullable=False, default="pending_ocr", index=True)
    failure_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    source = relationship("Source", back_populates="ingestion_jobs")
    grant = relationship("Grant", back_populates="ingestion_job", uselist=False)


class Watchlist(Base):
    __tablename__ = "watchlist"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    grant_id = Column(UUID(as_uuid=True), ForeignKey("grants.id"), nullable=False)
    saved_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="watchlist")
    grant = relationship("Grant", back_populates="watchlist_entries")


class AlertLog(Base):
    __tablename__ = "alert_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    grant_id = Column(UUID(as_uuid=True), ForeignKey("grants.id"), nullable=False)
    match_reason = Column(String, nullable=True)
    email_status = Column(String, default="queued")
    sendgrid_message_id = Column(String, nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="alert_logs")
    grant = relationship("Grant", back_populates="alert_logs")


class CommunitySubmission(Base):
    __tablename__ = "community_submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Two FKs to users — must be explicit on every relationship
    submitted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    source_url = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(String, default="pending", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    submitted_by_user = relationship(
        "User",
        foreign_keys=[submitted_by],
        back_populates="submissions",
    )
    reviewed_by_user = relationship(
        "User",
        foreign_keys=[reviewed_by],
    )
