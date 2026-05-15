from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import get_current_user
from app.schemas.user import UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_me(current_user=Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


# ── Change password ────────────────────────────────────────────────────────────

from pydantic import BaseModel as PydanticBase

class PasswordChangeRequest(PydanticBase):
    current_password: str
    new_password: str


@router.post("/me/change-password", status_code=204)
def change_password(
    payload: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.core.security import verify_password, hash_password
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
