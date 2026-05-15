import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, LoginRequest, TokenResponse, UserOut
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


def env_admin_credentials() -> tuple[str, str]:
    email = (os.environ.get("ADMIN_EMAIL") or "").strip().lower()
    password = os.environ.get("ADMIN_PASSWORD") or os.environ.get("ADMIN_PASS") or ""
    return email, password


def upsert_env_admin(db: Session, email: str, password: str) -> User | None:
    admin_email, admin_password = env_admin_credentials()
    if not admin_email or not admin_password:
        return None
    if email != admin_email or password != admin_password:
        return None

    user = db.query(User).filter(func.lower(User.email) == admin_email).first()
    if user:
        user.hashed_password = hash_password(admin_password)
        user.is_admin = True
        user.is_verified = True
        user.full_name = user.full_name or "Admin"
    else:
        user = User(
            email=admin_email,
            hashed_password=hash_password(admin_password),
            full_name="Admin",
            is_admin=True,
            is_verified=True,
            email_alerts_enabled=False,
        )
        db.add(user)

    db.commit()
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
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = str(payload.email).strip().lower()
    password = payload.password
    user = db.query(User).filter(func.lower(User.email) == email).first()
    password_ok = False
    if user:
        try:
            password_ok = verify_password(password, user.hashed_password)
        except Exception:
            password_ok = False

    if not user or not password_ok:
        user = upsert_env_admin(db, email, password)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))
