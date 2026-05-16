import uuid
from sqlalchemy import Column, String, DateTime, Numeric, Text, ForeignKey, ARRAY, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class GrantApplication(Base):
    """A researcher applies to a published grant."""
    __tablename__ = "grant_applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    grant_id = Column(UUID(as_uuid=True), ForeignKey("grants.id"), nullable=False)
    applicant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Status: draft → submitted → under_review → awarded | rejected | withdrawn
    status = Column(String, nullable=False, default="draft", index=True)

    # Cover form
    project_title = Column(String, nullable=False)
    abstract = Column(Text, nullable=False)           # 300 words
    objectives = Column(Text, nullable=True)
    methodology = Column(Text, nullable=True)
    expected_outcomes = Column(Text, nullable=True)
    research_areas = Column(ARRAY(String), nullable=False, default=list)

    # Team
    co_investigators = Column(JSONB, nullable=True)
    # [{"name": "...", "institution": "...", "designation": "...", "email": "..."}]

    # Timeline
    project_start_date = Column(String, nullable=True)   # YYYY-MM-DD
    project_end_date = Column(String, nullable=True)
    milestones = Column(JSONB, nullable=True)
    # [{"title": "...", "due_date": "...", "description": "..."}]

    # Budget (line items)
    budget_total_requested = Column(Numeric(15, 2), nullable=True)
    budget_breakdown = Column(JSONB, nullable=True)
    # {"personnel": 0, "equipment": 0, "travel": 0, "overhead": 0, "other": 0}

    # Uploaded files (paths in local storage / future S3)
    proposal_pdf_path = Column(String, nullable=True)
    cv_pdf_path = Column(String, nullable=True)
    supporting_docs_paths = Column(JSONB, nullable=True)  # list of paths

    # Reviewer decision
    reviewed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewer_note = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    awarded_amount = Column(Numeric(15, 2), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    submitted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    grant = relationship("Grant", back_populates="applications")
    applicant = relationship("User", foreign_keys=[applicant_id], back_populates="applications")
    reviewer = relationship("User", foreign_keys=[reviewed_by_id])
    research_project = relationship("ResearchProject", back_populates="application", uselist=False)


class ResearchProject(Base):
    """Created when a grant application is marked 'awarded'. Links to expense tracking."""
    __tablename__ = "research_projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("grant_applications.id"), nullable=True)
    grant_id = Column(UUID(as_uuid=True), ForeignKey("grants.id"), nullable=False)
    pi_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)  # Principal Investigator

    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    # Awarded budget
    total_budget = Column(Numeric(15, 2), nullable=False)
    currency = Column(String, default="BDT")
    budget_breakdown = Column(JSONB, nullable=True)

    # Timeline
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)

    # Status: active | completed | suspended
    status = Column(String, nullable=False, default="active")

    # Report submissions
    reports = Column(JSONB, nullable=True)
    # [{"type": "progress"|"final", "submitted_at": "...", "file_path": "...", "status": "pending"|"accepted"}]

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    application = relationship("GrantApplication", back_populates="research_project")
    grant = relationship("Grant", back_populates="research_projects")
    pi = relationship("User", foreign_keys=[pi_id], back_populates="research_projects")
    expenses = relationship("Expense", back_populates="project", cascade="all, delete-orphan")
    installments = relationship("FundInstallment", back_populates="project", cascade="all, delete-orphan")
    team_members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")


class ProjectMember(Base):
    """Team members on a research project who can submit expenses."""
    __tablename__ = "project_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("research_projects.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    role = Column(String, nullable=True)   # "co_investigator" | "student" | "ra" | "volunteer"
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("ResearchProject", back_populates="team_members")
    user = relationship("User")
    expenses = relationship("Expense", back_populates="submitted_by_member")


class FundInstallment(Base):
    """Fund installments received from the funder into the project."""
    __tablename__ = "fund_installments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("research_projects.id"), nullable=False)
    installment_number = Column(String, nullable=False)   # "1st", "2nd", etc.
    amount = Column(Numeric(15, 2), nullable=False)
    received_date = Column(String, nullable=True)
    bank_ref = Column(String, nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("ResearchProject", back_populates="installments")


class Expense(Base):
    """An expense claimed against a research project."""
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("research_projects.id"), nullable=False)
    member_id = Column(UUID(as_uuid=True), ForeignKey("project_members.id"), nullable=True)

    # Category mirrors research-tracker conventions
    category = Column(String, nullable=False)
    # "personnel" | "equipment" | "travel" | "consumables" | "overhead" | "publication" | "other"

    description = Column(String, nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String, default="BDT")
    expense_date = Column(String, nullable=False)   # YYYY-MM-DD

    # Receipt
    receipt_path = Column(String, nullable=True)
    vendor = Column(String, nullable=True)

    # Status: pending → approved | rejected
    status = Column(String, nullable=False, default="pending")
    approved_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    project = relationship("ResearchProject", back_populates="expenses")
    submitted_by_member = relationship("ProjectMember", back_populates="expenses")
    approved_by = relationship("User", foreign_keys=[approved_by_id])
