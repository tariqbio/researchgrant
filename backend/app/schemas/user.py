from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "researcher"           # "researcher" | "org"
    institution: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    academic_degree: Optional[str] = None
    orcid_id: Optional[str] = None
    phone: Optional[str] = None
    # Org fields (only if role == "org")
    org_name: Optional[str] = None
    org_type: Optional[str] = None
    org_website: Optional[str] = None
    org_address: Optional[str] = None
    org_description: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    institution: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    academic_degree: Optional[str] = None
    orcid_id: Optional[str] = None
    phone: Optional[str] = None
    research_interests: Optional[List[str]] = None
    preferred_language: Optional[str] = None
    email_alerts_enabled: Optional[bool] = None
    publication_count: Optional[int] = None
    # Org fields
    org_name: Optional[str] = None
    org_type: Optional[str] = None
    org_website: Optional[str] = None
    org_address: Optional[str] = None
    org_description: Optional[str] = None


class UserOut(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    account_status: str
    institution: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    academic_degree: Optional[str] = None
    orcid_id: Optional[str] = None
    phone: Optional[str] = None
    research_interests: List[str] = []
    publication_count: Optional[int] = 0
    preferred_language: str = "en"
    email_alerts_enabled: bool = True
    is_admin: bool = False
    org_name: Optional[str] = None
    org_type: Optional[str] = None
    org_website: Optional[str] = None
    org_verified: bool = False
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
