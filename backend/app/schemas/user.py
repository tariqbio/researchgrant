from pydantic import BaseModel, EmailStr
from typing import List, Optional
from uuid import UUID
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    institution: Optional[str] = None
    designation: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    institution: Optional[str] = None
    designation: Optional[str] = None
    preferred_language: Optional[str] = None
    research_interests: Optional[List[str]] = None
    email_alerts_enabled: Optional[bool] = None


class UserOut(BaseModel):
    id: UUID
    email: str
    full_name: str
    institution: Optional[str]
    designation: Optional[str]
    research_interests: List[str]
    preferred_language: str
    email_alerts_enabled: bool
    is_admin: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
