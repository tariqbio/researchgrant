from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from decimal import Decimal
from uuid import UUID


# ── Grant Application ────────────────────────────────────────────────────────

class ApplicationCreate(BaseModel):
    grant_id: UUID
    project_title: str
    abstract: str
    objectives: Optional[str] = None
    methodology: Optional[str] = None
    expected_outcomes: Optional[str] = None
    research_areas: List[str] = []
    co_investigators: Optional[List[Any]] = None
    project_start_date: Optional[str] = None
    project_end_date: Optional[str] = None
    milestones: Optional[List[Any]] = None
    budget_total_requested: Optional[Decimal] = None
    budget_breakdown: Optional[Any] = None


class ApplicationUpdate(BaseModel):
    project_title: Optional[str] = None
    abstract: Optional[str] = None
    objectives: Optional[str] = None
    methodology: Optional[str] = None
    expected_outcomes: Optional[str] = None
    research_areas: Optional[List[str]] = None
    co_investigators: Optional[List[Any]] = None
    project_start_date: Optional[str] = None
    project_end_date: Optional[str] = None
    milestones: Optional[List[Any]] = None
    budget_total_requested: Optional[Decimal] = None
    budget_breakdown: Optional[Any] = None


class ApplicationOut(BaseModel):
    id: UUID
    grant_id: UUID
    applicant_id: UUID
    status: str
    project_title: str
    abstract: str
    objectives: Optional[str] = None
    methodology: Optional[str] = None
    expected_outcomes: Optional[str] = None
    research_areas: List[str] = []
    co_investigators: Optional[Any] = None
    project_start_date: Optional[str] = None
    project_end_date: Optional[str] = None
    milestones: Optional[Any] = None
    budget_total_requested: Optional[Decimal] = None
    budget_breakdown: Optional[Any] = None
    proposal_pdf_path: Optional[str] = None
    cv_pdf_path: Optional[str] = None
    reviewer_note: Optional[str] = None
    awarded_amount: Optional[Decimal] = None
    created_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Research Project ─────────────────────────────────────────────────────────

class ProjectOut(BaseModel):
    id: UUID
    grant_id: UUID
    pi_id: UUID
    application_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    total_budget: Decimal
    currency: str
    budget_breakdown: Optional[Any] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: str
    reports: Optional[Any] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Expense ──────────────────────────────────────────────────────────────────

class ExpenseCreate(BaseModel):
    category: str
    description: str
    amount: Decimal
    expense_date: str
    vendor: Optional[str] = None
    note: Optional[str] = None
    member_id: Optional[UUID] = None


class ExpenseOut(BaseModel):
    id: UUID
    project_id: UUID
    member_id: Optional[UUID] = None
    category: str
    description: str
    amount: Decimal
    currency: str
    expense_date: str
    receipt_path: Optional[str] = None
    vendor: Optional[str] = None
    status: str
    rejection_reason: Optional[str] = None
    note: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Fund Installment ──────────────────────────────────────────────────────────

class InstallmentCreate(BaseModel):
    installment_number: str
    amount: Decimal
    received_date: Optional[str] = None
    bank_ref: Optional[str] = None
    note: Optional[str] = None


class InstallmentOut(BaseModel):
    id: UUID
    project_id: UUID
    installment_number: str
    amount: Decimal
    received_date: Optional[str] = None
    bank_ref: Optional[str] = None
    note: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Project Member ────────────────────────────────────────────────────────────

class MemberCreate(BaseModel):
    name: str
    email: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[UUID] = None


class MemberOut(BaseModel):
    id: UUID
    project_id: UUID
    user_id: Optional[UUID] = None
    name: str
    email: Optional[str] = None
    role: Optional[str] = None

    model_config = {"from_attributes": True}
