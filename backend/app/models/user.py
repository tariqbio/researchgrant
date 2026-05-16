import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

# Role hierarchy:
#   god_admin   → platform owner, sees everything, assigns staff
#   moderator   → reviews grants, manages pipeline, approves orgs
#   org         → funding organization, publishes grant calls
#   researcher  → applies to grants, tracks expenses, submits reports


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)

    # Role: "researcher" | "org" | "moderator" | "god_admin"
    role = Column(String, nullable=False, default="researcher")

    # "pending" | "active" | "suspended"
    account_status = Column(String, nullable=False, default="active")

    # ── Researcher / staff profile ────────────────────────────────────────────
    institution = Column(String, nullable=True)
    department = Column(String, nullable=True)
    designation = Column(String, nullable=True)
    academic_degree = Column(String, nullable=True)
    orcid_id = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    research_interests = Column(ARRAY(String), nullable=False, default=list)
    publication_count = Column(Integer, nullable=True, default=0)

    # ── Organization profile ──────────────────────────────────────────────────
    org_name = Column(String, nullable=True)
    org_type = Column(String, nullable=True)   # "government"|"university"|"ngo"|"private"
    org_website = Column(String, nullable=True)
    org_address = Column(String, nullable=True)
    org_description = Column(Text, nullable=True)
    org_verified = Column(Boolean, default=False)

    # ── Preferences ───────────────────────────────────────────────────────────
    preferred_language = Column(String, nullable=False, default="en")
    email_alerts_enabled = Column(Boolean, default=True)

    # Legacy columns — kept so existing DB rows don't break
    is_admin = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── Relationships ──────────────────────────────────────────────────────────
    watchlist = relationship("Watchlist", back_populates="user", cascade="all, delete-orphan")
    alert_logs = relationship("AlertLog", back_populates="user")
    submissions = relationship(
        "CommunitySubmission",
        foreign_keys="CommunitySubmission.submitted_by",
        back_populates="submitted_by_user",
    )
    published_grants = relationship(
        "Grant",
        foreign_keys="Grant.org_publisher_id",
        back_populates="org_publisher",
    )
    applications = relationship(
        "GrantApplication",
        foreign_keys="GrantApplication.applicant_id",
        back_populates="applicant",
    )
    research_projects = relationship(
        "ResearchProject",
        foreign_keys="ResearchProject.pi_id",
        back_populates="pi",
    )
