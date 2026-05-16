"""Organization routes — publish grant calls, review applications."""
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.core.security import get_current_user, get_current_org
from app.models.grant import Grant
from app.models.user import User
from app.schemas.grant import GrantCreate, GrantOut, GrantUpdate

router = APIRouter(prefix="/org", tags=["org"])


@router.post("/grants", response_model=GrantOut, status_code=201)
def publish_grant(payload: GrantCreate, db: Session = Depends(get_db), org=Depends(get_current_org)):
    """Verified org publishes a grant call directly — goes live immediately."""
    grant = Grant(
        **payload.model_dump(),
        org_publisher_id=org.id,
        issuing_agency=org.org_name or org.full_name,
        agency_type=org.org_type,
        status="published",
        published_at=datetime.utcnow(),
        ai_confidence_score=1.0,
    )
    db.add(grant)
    db.commit()
    db.refresh(grant)
    from app.services.alert_service import trigger_alerts_for_grant
    trigger_alerts_for_grant(db, grant)
    return grant


@router.get("/grants", response_model=List[GrantOut])
def my_published_grants(db: Session = Depends(get_db), org=Depends(get_current_org)):
    return db.query(Grant).filter(Grant.org_publisher_id == org.id).order_by(Grant.created_at.desc()).all()


@router.patch("/grants/{grant_id}", response_model=GrantOut)
def update_my_grant(grant_id: uuid.UUID, payload: GrantUpdate, db: Session = Depends(get_db), org=Depends(get_current_org)):
    grant = db.query(Grant).filter(Grant.id == grant_id, Grant.org_publisher_id == org.id).first()
    if not grant:
        raise HTTPException(404, "Grant not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(grant, field, value)
    db.commit()
    db.refresh(grant)
    return grant


@router.get("/profile")
def org_profile(org=Depends(get_current_org)):
    return {
        "id": str(org.id),
        "org_name": org.org_name,
        "org_type": org.org_type,
        "org_website": org.org_website,
        "org_verified": org.org_verified,
        "account_status": org.account_status,
    }
