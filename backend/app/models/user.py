import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    institution = Column(String, nullable=True)
    designation = Column(String, nullable=True)

    # Array of research area slugs e.g. ["biotechnology", "life_sciences"]
    research_interests = Column(ARRAY(String), nullable=False, default=list)

    preferred_language = Column(String, nullable=False, default="en")  # "en" | "bn"
    email_alerts_enabled = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    watchlist = relationship("Watchlist", back_populates="user", cascade="all, delete-orphan")
    alert_logs = relationship("AlertLog", back_populates="user")
    submissions = relationship("CommunitySubmission", back_populates="submitted_by_user")
