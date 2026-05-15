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
    """Create or update admin user. Called both at login and via /api/admin/init."""
    existing = db.query(User).filter(func.lower(User.email) == email).first()
    if existing:
        existing.hashed_password = hash_password(password)
        existing.is_admin = True
        existing.is_verified = True
        db.commit()
        db.refresh(existing)
        return existing
    user = User(
        email=email,
        hashed_password=hash_password(password),
        full_name=os.environ.get("ADMIN_NAME", "Admin"),
        is_admin=True,
        is_verified=True,
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

    user = User(
        email=email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        institution=payload.institution,
        designation=payload.designation,
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

    # Check if credentials match the env admin
    admin_email, admin_password = get_env_admin()
    if admin_email and admin_password and email == admin_email and password == admin_password:
        # Always create/refresh admin on correct env credentials — no bcrypt verify needed
        user = ensure_admin_exists(db, admin_email, admin_password)
        token = create_access_token(str(user.id))
        return TokenResponse(access_token=token, user=UserOut.model_validate(user))

    # Normal user login
    user = db.query(User).filter(func.lower(User.email) == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    try:
        password_ok = verify_password(password, user.hashed_password)
    except Exception:
        password_ok = False

    if not password_ok:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/admin/init")
def init_admin(db: Session = Depends(get_db)):
    """
    One-time endpoint to force-create the admin account from env vars.
    Call this once after first deploy if login isn't working:
    POST /api/auth/admin/init
    No body needed — reads ADMIN_EMAIL and ADMIN_PASSWORD from environment.
    """
    admin_email, admin_password = get_env_admin()
    if not admin_email or not admin_password:
        raise HTTPException(
            status_code=400,
            detail="ADMIN_EMAIL and ADMIN_PASSWORD environment variables are not set"
        )
    user = ensure_admin_exists(db, admin_email, admin_password)
    return {"status": "ok", "email": user.email, "is_admin": user.is_admin}
