"""
Grant Applications, Research Projects, Expenses, Installments
All scoped to the current user's role.
"""
import os
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import get_current_user, get_current_admin
from app.core.config import settings
from app.models.application import GrantApplication, ResearchProject, Expense, FundInstallment, ProjectMember
from app.models.grant import Grant
from app.schemas.application import (
    ApplicationCreate, ApplicationUpdate, ApplicationOut,
    ProjectOut, ExpenseCreate, ExpenseOut,
    InstallmentCreate, InstallmentOut, MemberCreate, MemberOut,
)

router = APIRouter(prefix="/applications", tags=["applications"])


def save_upload(file_bytes: bytes, filename: str) -> str:
    os.makedirs(settings.STORAGE_LOCAL_PATH, exist_ok=True)
    unique_name = f"{uuid.uuid4()}_{filename}"
    path = os.path.join(settings.STORAGE_LOCAL_PATH, unique_name)
    with open(path, "wb") as f:
        f.write(file_bytes)
    return path


# ── Applications (researcher creates/manages their applications) ───────────────

@router.post("", response_model=ApplicationOut, status_code=201)
def create_application(payload: ApplicationCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ("researcher", "god_admin"):
        raise HTTPException(403, "Only researchers can apply to grants")
    grant = db.query(Grant).filter(Grant.id == payload.grant_id, Grant.status == "published").first()
    if not grant:
        raise HTTPException(404, "Grant not found or not accepting applications")
    # One application per researcher per grant
    existing = db.query(GrantApplication).filter(
        GrantApplication.grant_id == payload.grant_id,
        GrantApplication.applicant_id == user.id,
    ).first()
    if existing:
        raise HTTPException(400, "You have already applied to this grant")
    app = GrantApplication(**payload.model_dump(), applicant_id=user.id)
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.get("/mine", response_model=List[ApplicationOut])
def my_applications(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(GrantApplication).filter(GrantApplication.applicant_id == user.id).order_by(GrantApplication.created_at.desc()).all()


@router.get("/{app_id}", response_model=ApplicationOut)
def get_application(app_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)):
    app = db.query(GrantApplication).filter(GrantApplication.id == app_id).first()
    if not app:
        raise HTTPException(404, "Application not found")
    # Researcher sees own, org sees applications to their grants, admin sees all
    if user.role == "researcher" and app.applicant_id != user.id:
        raise HTTPException(403, "Not your application")
    if user.role == "org":
        grant = db.query(Grant).filter(Grant.id == app.grant_id, Grant.org_publisher_id == user.id).first()
        if not grant:
            raise HTTPException(403, "Not your grant")
    return app


@router.patch("/{app_id}", response_model=ApplicationOut)
def update_application(app_id: uuid.UUID, payload: ApplicationUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    app = db.query(GrantApplication).filter(GrantApplication.id == app_id, GrantApplication.applicant_id == user.id).first()
    if not app:
        raise HTTPException(404, "Application not found")
    if app.status not in ("draft", "submitted"):
        raise HTTPException(400, "Cannot edit application in current status")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(app, field, value)
    db.commit()
    db.refresh(app)
    return app


@router.post("/{app_id}/submit")
def submit_application(app_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)):
    app = db.query(GrantApplication).filter(GrantApplication.id == app_id, GrantApplication.applicant_id == user.id).first()
    if not app:
        raise HTTPException(404, "Application not found")
    if app.status != "draft":
        raise HTTPException(400, "Application already submitted")
    app.status = "submitted"
    app.submitted_at = datetime.utcnow()
    db.commit()
    return {"status": "submitted"}


@router.post("/{app_id}/upload-proposal")
async def upload_proposal(app_id: uuid.UUID, file: UploadFile = File(...), db: Session = Depends(get_db), user=Depends(get_current_user)):
    app = db.query(GrantApplication).filter(GrantApplication.id == app_id, GrantApplication.applicant_id == user.id).first()
    if not app:
        raise HTTPException(404, "Not found")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF accepted")
    file_bytes = await file.read()
    path = save_upload(file_bytes, f"proposal_{file.filename}")
    app.proposal_pdf_path = path
    db.commit()
    return {"path": path}


@router.post("/{app_id}/upload-cv")
async def upload_cv(app_id: uuid.UUID, file: UploadFile = File(...), db: Session = Depends(get_db), user=Depends(get_current_user)):
    app = db.query(GrantApplication).filter(GrantApplication.id == app_id, GrantApplication.applicant_id == user.id).first()
    if not app:
        raise HTTPException(404, "Not found")
    file_bytes = await file.read()
    path = save_upload(file_bytes, f"cv_{file.filename}")
    app.cv_pdf_path = path
    db.commit()
    return {"path": path}


# ── Org / admin: review applications for their grants ──────────────────────────

@router.get("/for-grant/{grant_id}", response_model=List[ApplicationOut])
def applications_for_grant(grant_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)):
    grant = db.query(Grant).filter(Grant.id == grant_id).first()
    if not grant:
        raise HTTPException(404, "Grant not found")
    if user.role == "org" and grant.org_publisher_id != user.id:
        raise HTTPException(403, "Not your grant")
    if user.role == "researcher":
        raise HTTPException(403, "Not permitted")
    return db.query(GrantApplication).filter(GrantApplication.grant_id == grant_id).order_by(GrantApplication.submitted_at.desc()).all()


@router.post("/{app_id}/decision")
def decide_application(app_id: uuid.UUID, action: str, awarded_amount: Optional[Decimal] = None,
                        reviewer_note: Optional[str] = None, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Org or admin awards/rejects an application. If awarded, creates a ResearchProject."""
    if action not in ("award", "reject", "shortlist"):
        raise HTTPException(400, "action must be award|reject|shortlist")
    app = db.query(GrantApplication).filter(GrantApplication.id == app_id).first()
    if not app:
        raise HTTPException(404, "Not found")
    grant = db.query(Grant).filter(Grant.id == app.grant_id).first()
    if user.role == "org" and grant.org_publisher_id != user.id:
        raise HTTPException(403, "Not your grant")
    if user.role == "researcher":
        raise HTTPException(403, "Not permitted")

    app.reviewer_note = reviewer_note
    app.reviewed_by_id = user.id
    app.reviewed_at = datetime.utcnow()

    if action == "award":
        app.status = "awarded"
        app.awarded_amount = awarded_amount or grant.funding_max
        # Auto-create ResearchProject
        project = ResearchProject(
            application_id=app.id,
            grant_id=app.grant_id,
            pi_id=app.applicant_id,
            title=app.project_title,
            description=app.abstract,
            total_budget=app.awarded_amount or Decimal("0"),
            budget_breakdown=app.budget_breakdown,
            start_date=app.project_start_date,
            end_date=app.project_end_date,
            status="active",
        )
        db.add(project)
    elif action == "reject":
        app.status = "rejected"
    elif action == "shortlist":
        app.status = "under_review"

    db.commit()
    return {"status": app.status}


# ── Research Projects ──────────────────────────────────────────────────────────

@router.get("/projects/mine", response_model=List[ProjectOut])
def my_projects(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(ResearchProject).filter(ResearchProject.pi_id == user.id).order_by(ResearchProject.created_at.desc()).all()


@router.get("/projects/{project_id}", response_model=ProjectOut)
def get_project(project_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)):
    project = db.query(ResearchProject).filter(ResearchProject.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")
    if user.role == "researcher" and project.pi_id != user.id:
        raise HTTPException(403, "Not your project")
    return project


# ── Expenses ──────────────────────────────────────────────────────────────────

@router.get("/projects/{project_id}/expenses", response_model=List[ExpenseOut])
def list_expenses(project_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)):
    project = db.query(ResearchProject).filter(ResearchProject.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")
    if user.role == "researcher" and project.pi_id != user.id:
        raise HTTPException(403, "Not your project")
    return db.query(Expense).filter(Expense.project_id == project_id).order_by(Expense.created_at.desc()).all()


@router.post("/projects/{project_id}/expenses", response_model=ExpenseOut, status_code=201)
def add_expense(project_id: uuid.UUID, payload: ExpenseCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    project = db.query(ResearchProject).filter(ResearchProject.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")
    if user.role == "researcher" and project.pi_id != user.id:
        raise HTTPException(403, "Not your project")
    expense = Expense(project_id=project_id, **payload.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.post("/projects/{project_id}/expenses/{expense_id}/approve")
def approve_expense(project_id: uuid.UUID, expense_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.project_id == project_id).first()
    if not expense:
        raise HTTPException(404, "Expense not found")
    project = db.query(ResearchProject).filter(ResearchProject.id == project_id).first()
    if user.role == "researcher" and project.pi_id != user.id:
        raise HTTPException(403, "Only PI or admin can approve expenses")
    expense.status = "approved"
    expense.approved_by_id = user.id
    expense.approved_at = datetime.utcnow()
    db.commit()
    return {"status": "approved"}


@router.post("/projects/{project_id}/expenses/{expense_id}/reject")
def reject_expense(project_id: uuid.UUID, expense_id: uuid.UUID, reason: Optional[str] = None,
                   db: Session = Depends(get_db), user=Depends(get_current_user)):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.project_id == project_id).first()
    if not expense:
        raise HTTPException(404, "Expense not found")
    expense.status = "rejected"
    expense.rejection_reason = reason
    db.commit()
    return {"status": "rejected"}


@router.post("/projects/{project_id}/expenses/{expense_id}/upload-receipt")
async def upload_receipt(project_id: uuid.UUID, expense_id: uuid.UUID, file: UploadFile = File(...),
                         db: Session = Depends(get_db), user=Depends(get_current_user)):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.project_id == project_id).first()
    if not expense:
        raise HTTPException(404, "Not found")
    file_bytes = await file.read()
    path = save_upload(file_bytes, f"receipt_{file.filename}")
    expense.receipt_path = path
    db.commit()
    return {"path": path}


# ── Fund Installments ──────────────────────────────────────────────────────────

@router.get("/projects/{project_id}/installments", response_model=List[InstallmentOut])
def list_installments(project_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(FundInstallment).filter(FundInstallment.project_id == project_id).order_by(FundInstallment.created_at).all()


@router.post("/projects/{project_id}/installments", response_model=InstallmentOut, status_code=201)
def add_installment(project_id: uuid.UUID, payload: InstallmentCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    inst = FundInstallment(project_id=project_id, **payload.model_dump())
    db.add(inst)
    db.commit()
    db.refresh(inst)
    return inst


# ── Team Members ───────────────────────────────────────────────────────────────

@router.get("/projects/{project_id}/members", response_model=List[MemberOut])
def list_members(project_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(ProjectMember).filter(ProjectMember.project_id == project_id).all()


@router.post("/projects/{project_id}/members", response_model=MemberOut, status_code=201)
def add_member(project_id: uuid.UUID, payload: MemberCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    member = ProjectMember(project_id=project_id, **payload.model_dump())
    db.add(member)
    db.commit()
    db.refresh(member)
    return member
