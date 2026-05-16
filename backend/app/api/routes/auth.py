import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, LoginRequest, TokenResponse, UserOut
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


def get_env_admin() -> tuple[str, str]:
    email = (os.environ.get("ADMIN_EMAIL") or "").strip().lower()
    password = os.environ.get("ADMIN_PASSWORD") or os.environ.get("ADMIN_PASS") or ""
    return email, password


def ensure_admin_exists(db: Session, email: str, password: str) -> User:
    existing = db.query(User).filter(func.lower(User.email) == email).first()
    if existing:
        existing.hashed_password = hash_password(password)
        existing.is_admin = True
        existing.role = "god_admin"
        existing.account_status = "active"
        existing.is_verified = True
        db.commit()
        db.refresh(existing)
        return existing
    user = User(
        email=email,
        hashed_password=hash_password(password),
        full_name=os.environ.get("ADMIN_NAME", "God Admin"),
        role="god_admin",
        is_admin=True,
        is_verified=True,
        account_status="active",
        email_alerts_enabled=False,
        research_interests=[],
        preferred_language="en",
    )
    db.add(user)
    db.commit()
    db.expire_all()
    db.refresh(user)
    return user


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    email = str(payload.email).strip().lower()
    if db.query(User).filter(func.lower(User.email) == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    role = payload.role if payload.role in ("researcher", "org") else "researcher"
    # Orgs start as pending until verified by god_admin
    account_status = "pending" if role == "org" else "active"

    user = User(
        email=email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=role,
        account_status=account_status,
        institution=payload.institution,
        department=payload.department,
        designation=payload.designation,
        academic_degree=payload.academic_degree,
        orcid_id=payload.orcid_id,
        phone=payload.phone,
        org_name=payload.org_name,
        org_type=payload.org_type,
        org_website=payload.org_website,
        org_address=payload.org_address,
        org_description=payload.org_description,
        research_interests=[],
        preferred_language="en",
    )
    db.add(user)
    db.commit()
    db.expire_all()
    db.refresh(user)

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = str(payload.email).strip().lower()
    password = payload.password

    admin_email, admin_password = get_env_admin()
    if admin_email and admin_password and email == admin_email and password == admin_password:
        user = ensure_admin_exists(db, admin_email, admin_password)
        token = create_access_token(str(user.id))
        return TokenResponse(access_token=token, user=UserOut.model_validate(user))

    user = db.query(User).filter(func.lower(User.email) == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    try:
        password_ok = verify_password(password, user.hashed_password)
    except Exception:
        password_ok = False

    if not password_ok:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.account_status == "suspended":
        raise HTTPException(status_code=403, detail="Account suspended. Contact support.")

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/admin/init")
def init_admin(db: Session = Depends(get_db)):
    admin_email, admin_password = get_env_admin()
    if not admin_email or not admin_password:
        raise HTTPException(status_code=400, detail="ADMIN_EMAIL and ADMIN_PASSWORD not set")
    user = ensure_admin_exists(db, admin_email, admin_password)
    return {"status": "ok", "email": user.email, "role": user.role}


@router.post("/setup")
def first_time_setup(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).count() > 0:
        raise HTTPException(status_code=403, detail="Setup already complete. Use /login.")
    email = str(payload.email).strip().lower()
    user = User(
        email=email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role="god_admin",
        is_admin=True,
        is_verified=True,
        account_status="active",
        email_alerts_enabled=False,
        research_interests=[],
        preferred_language="en",
    )
    db.add(user)
    db.commit()
    db.expire_all()
    db.refresh(user)
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/setup/status")
def setup_status(db: Session = Depends(get_db)):
    return {"needs_setup": db.query(User).count() == 0}
