"""God Admin routes — platform management, user management, stats."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr

from app.db.session import get_db
from app.core.security import get_god_admin, get_current_admin, hash_password
from app.models.user import User
from app.models.grant import Grant
from app.models.application import GrantApplication, ResearchProject, Expense
from app.schemas.user import UserOut


class StaffCreateRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "moderator"  # moderator | god_admin

router = APIRouter(prefix="/god-admin", tags=["god-admin"])


# ── Platform Stats ─────────────────────────────────────────────────────────────

@router.get("/stats")
def platform_stats(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    from datetime import date, timedelta
    total_users = db.query(User).filter(User.role == "researcher").count()
    total_orgs = db.query(User).filter(User.role == "org").count()
    pending_orgs = db.query(User).filter(User.role == "org", User.account_status == "pending").count()
    total_grants = db.query(Grant).filter(Grant.status == "published").count()
    pending_grants = db.query(Grant).filter(Grant.status == "pending_review").count()
    total_applications = db.query(GrantApplication).count()
    awarded = db.query(GrantApplication).filter(GrantApplication.status == "awarded").count()
    total_projects = db.query(ResearchProject).count()
    active_projects = db.query(ResearchProject).filter(ResearchProject.status == "active").count()
    total_moderators = db.query(User).filter(User.role == "moderator").count()
    return {
        "users": {"total": total_users},
        "orgs": {"total": total_orgs, "pending_verification": pending_orgs},
        "grants": {"published": total_grants, "pending_review": pending_grants},
        "applications": {"total": total_applications, "awarded": awarded},
        "projects": {"total": total_projects, "active": active_projects},
        "staff": {"moderators": total_moderators},
    }


# ── User Management ────────────────────────────────────────────────────────────

@router.get("/users")
def list_all_users(
    role: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    if status:
        q = q.filter(User.account_status == status)
    total = q.count()
    users = q.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "items": [UserOut.model_validate(u) for u in users]}


@router.post("/users/{user_id}/verify-org")
def verify_org(user_id: UUID, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    """Verify an organization account so they can publish grants."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role != "org":
        raise HTTPException(404, "Organization not found")
    user.org_verified = True
    user.account_status = "active"
    db.commit()
    return {"status": "verified", "org_name": user.org_name}


@router.post("/users/{user_id}/reject-org")
def reject_org(user_id: UUID, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.account_status = "suspended"
    db.commit()
    return {"status": "suspended"}


@router.post("/users/{user_id}/set-role")
def set_role(user_id: UUID, role: str, db: Session = Depends(get_db), admin=Depends(get_god_admin)):
    """God admin only — promote to moderator or demote."""
    if role not in ("researcher", "moderator", "god_admin"):
        raise HTTPException(400, "Invalid role. Use researcher|moderator|god_admin")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.role = role
    if role in ("moderator", "god_admin"):
        user.is_admin = True
        user.account_status = "active"
    db.commit()
    return {"status": "ok", "new_role": role}


@router.post("/users/{user_id}/suspend")
def suspend_user(user_id: UUID, db: Session = Depends(get_db), admin=Depends(get_god_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.account_status = "suspended"
    db.commit()
    return {"status": "suspended"}


@router.post("/users/{user_id}/reactivate")
def reactivate_user(user_id: UUID, db: Session = Depends(get_db), admin=Depends(get_god_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.account_status = "active"
    db.commit()
    return {"status": "active"}


# ── Pending Org queue ──────────────────────────────────────────────────────────

@router.get("/orgs/pending")
def pending_orgs(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    orgs = db.query(User).filter(User.role == "org", User.account_status == "pending").order_by(User.created_at).all()
    return [UserOut.model_validate(o) for o in orgs]


# ── Create Staff Account ───────────────────────────────────────────────────────

@router.post("/staff", response_model=UserOut)
def create_staff_account(
    payload: StaffCreateRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_god_admin),
):
    """God admin creates a moderator or god_admin account directly. No approval needed."""
    if payload.role not in ("moderator", "god_admin"):
        raise HTTPException(400, "Role must be moderator or god_admin")

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(400, "An account with this email already exists")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        is_admin=True,
        account_status="active",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)
