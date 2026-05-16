from datetime import datetime, timedelta
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def hash_password(password: str) -> str:
    pw_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pw_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    pw_bytes = plain.encode("utf-8")[:72]
    hashed_bytes = hashed.encode("utf-8") if isinstance(hashed, str) else hashed
    return bcrypt.checkpw(pw_bytes, hashed_bytes)


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return jwt.encode({"sub": subject, "exp": expire}, settings.SECRET_KEY, algorithm="HS256")


def decode_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload.get("sub")
    except JWTError:
        return None


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    from app.models.user import User
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_current_admin(current_user=Depends(get_current_user)):
    """Moderator OR god_admin — anyone who can manage the platform."""
    if current_user.role not in ("moderator", "god_admin") and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff access required")
    return current_user


def get_god_admin(current_user=Depends(get_current_user)):
    """Only god_admin."""
    if current_user.role != "god_admin" and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="God admin access required")
    return current_user


def get_current_org(current_user=Depends(get_current_user)):
    """Verified org account."""
    if current_user.role != "org":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Organization account required")
    if not current_user.org_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your organization account is pending verification")
    return current_user
