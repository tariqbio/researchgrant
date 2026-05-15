from fastapi import APIRouter, Depends, HTTPException, Response, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from datetime import date

from app.db.session import get_db
from app.core.security import get_current_user, get_current_admin
from app.schemas.grant import (
    GrantOut, GrantListResponse, GrantSearchParams,
    GrantAdminAction, GrantCreate, GrantUpdate,
)
from app.services.grant_service import (
    search_grants, get_grant_by_id, toggle_watchlist, update_grant,
)
from app.services.alert_service import trigger_alerts_for_grant
from app.models.grant import Grant
from app.models.pipeline import Watchlist

router = APIRouter(prefix="/grants", tags=["grants"])


# ── Public (no auth) ──────────────────────────────────────────────────────────

@router.get("/public", response_model=GrantListResponse)
def list_grants_public(
    query: Optional[str] = None,
    research_areas: Optional[str] = None,
    deadline_within_days: Optional[int] = None,
    sort_by: str = "deadline",
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    params = GrantSearchParams(
        query=query,
        research_areas=research_areas.split(",") if research_areas else None,
        deadline_within_days=deadline_within_days,
        sort_by=sort_by, page=page, page_size=page_size,
    )
    grants, total = search_grants(db, params)
    return GrantListResponse(items=grants, total=total, page=page, page_size=page_size)


# ── IMPORTANT: specific paths BEFORE /{grant_id} so FastAPI doesn't try to
#    parse "me", "admin", "public" as UUIDs and return 422 ─────────────────────

# ── Researcher: my grants ─────────────────────────────────────────────────────

@router.get("", response_model=GrantListResponse)
def list_grants(
    query: Optional[str] = None,
    research_areas: Optional[str] = None,
    eligibility_types: Optional[str] = None,
    deadline_within_days: Optional[int] = None,
    funding_min: Optional[float] = None,
    funding_max: Optional[float] = None,
    agency: Optional[str] = None,
    sort_by: str = "deadline",
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    params = GrantSearchParams(
        query=query,
        research_areas=research_areas.split(",") if research_areas else None,
        eligibility_types=eligibility_types.split(",") if eligibility_types else None,
        deadline_within_days=deadline_within_days,
        funding_min=funding_min, funding_max=funding_max,
        agency=agency, sort_by=sort_by, page=page, page_size=page_size,
    )
    grants, total = search_grants(db, params, current_user)
    return GrantListResponse(items=grants, total=total, page=page, page_size=page_size)


@router.get("/me/watchlist", response_model=GrantListResponse)   # MUST be before /{grant_id}
def my_watchlist(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    total = db.query(Watchlist).filter(Watchlist.user_id == current_user.id).count()
    entries = (
        db.query(Watchlist)
        .filter(Watchlist.user_id == current_user.id)
        .order_by(Watchlist.saved_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    grants = [get_grant_by_id(db, e.grant_id, current_user) for e in entries]
    grants = [g for g in grants if g is not None]
    return GrantListResponse(items=grants, total=total, page=page, page_size=page_size)


# ── Admin routes (also before /{grant_id}) ────────────────────────────────────

@router.get("/admin/queue", response_model=GrantListResponse)
def review_queue(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """Grants pending admin review, lowest AI confidence first (most work needed)."""
    q = (
        db.query(Grant)
        .filter(Grant.status == "pending_review")
        .order_by(Grant.ai_confidence_score.asc().nullsfirst())
    )
    total = q.count()
    grants = q.offset((page - 1) * page_size).limit(page_size).all()
    return GrantListResponse(items=grants, total=total, page=page, page_size=page_size)


@router.post("/admin/create", response_model=GrantOut, status_code=201)
def create_grant_manually(
    payload: GrantCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """
    Admin creates a grant manually without going through the OCR pipeline.
    Useful for text-based notices that don't need AI extraction.
    Grant is published immediately (no review step needed — admin wrote it).
    """
    from datetime import datetime
    grant = Grant(
        **payload.model_dump(),
        status="published",
        reviewed_by=admin.id,
        published_at=datetime.utcnow(),
        ai_confidence_score=1.0,  # manual entry = perfect confidence
    )
    db.add(grant)
    db.commit()
    db.refresh(grant)
    # Trigger alerts for manually created grants too
    trigger_alerts_for_grant(db, grant)
    return grant


@router.post("/admin/{grant_id}/action")
def review_action(
    grant_id: UUID,
    payload: GrantAdminAction,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    grant = db.query(Grant).filter(Grant.id == grant_id).first()
    if not grant:
        raise HTTPException(status_code=404, detail="Grant not found")

    if payload.action == "approve":
        if payload.edits:
            update_grant(db, grant, payload.edits)
            db.refresh(grant)
        grant.status = "published"
        grant.reviewed_by = admin.id
        from datetime import datetime
        grant.published_at = datetime.utcnow()
        db.commit()
        alerts_sent = trigger_alerts_for_grant(db, grant)
        return {"status": "published", "alerts_sent": alerts_sent}

    elif payload.action == "reject":
        grant.status = "rejected"
        grant.admin_note = payload.admin_note
        db.commit()
        return {"status": "rejected"}

    raise HTTPException(status_code=400, detail="action must be 'approve' or 'reject'")


# ── Per-grant endpoints (/{grant_id} last to avoid swallowing other routes) ───

@router.get("/{grant_id}", response_model=GrantOut)
def get_grant(
    grant_id: UUID,
    db: Session = Depends(get_db),
):
    """Public grant detail — no auth required so share links work."""
    grant = get_grant_by_id(db, grant_id)
    if not grant or grant.status != "published":
        raise HTTPException(status_code=404, detail="Grant not found")
    return grant


@router.post("/{grant_id}/watchlist")
def toggle_watchlist_endpoint(
    grant_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    grant = db.query(Grant).filter(Grant.id == grant_id).first()
    if not grant:
        raise HTTPException(status_code=404, detail="Grant not found")
    saved = toggle_watchlist(db, current_user, grant_id)
    return {"saved": saved}


@router.get("/{grant_id}/calendar.ics")
def download_ics(
    grant_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Download a .ics calendar file for the grant deadline.
    Works with Google Calendar, Outlook, Apple Calendar.
    """
    grant = db.query(Grant).filter(Grant.id == grant_id, Grant.status == "published").first()
    if not grant:
        raise HTTPException(status_code=404, detail="Grant not found")
    if not grant.deadline:
        raise HTTPException(status_code=400, detail="This grant has no deadline set")

    dl = grant.deadline
    # ICS date format: YYYYMMDD
    date_str = dl.strftime("%Y%m%d")
    # Next day for DTEND (all-day event convention)
    from datetime import timedelta
    end = (dl + timedelta(days=1)).strftime("%Y%m%d")
    now_str = date.today().strftime("%Y%m%dT%H%M%SZ")
    uid = f"{grant.id}@grantbd.com"
    title = grant.title_en.replace(",", "\\,").replace(";", "\\;")
    desc = f"Deadline: {dl} | Agency: {grant.issuing_agency} | https://grantbd.com/grants/{grant.id}"

    ics = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//GrantBD//Grant Deadline//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:{uid}
DTSTART;VALUE=DATE:{date_str}
DTEND;VALUE=DATE:{end}
DTSTAMP:{now_str}
SUMMARY:{title} — Deadline
DESCRIPTION:{desc}
URL:https://grantbd.com/grants/{grant.id}
BEGIN:VALARM
TRIGGER:-P7D
ACTION:DISPLAY
DESCRIPTION:7 days until grant deadline: {title}
END:VALARM
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Tomorrow: grant deadline for {title}
END:VALARM
END:VEVENT
END:VCALENDAR"""

    return Response(
        content=ics,
        media_type="text/calendar",
        headers={
            "Content-Disposition": f'attachment; filename="grant-deadline-{grant_id}.ics"'
        },
    )


# ── Public stats endpoint ─────────────────────────────────────────────────────

@router.get("/stats/summary")
def get_stats(db: Session = Depends(get_db)):
    """Live platform stats for homepage and dashboard counters."""
    from datetime import timedelta
    total_published = db.query(Grant).filter(Grant.status == "published").count()
    expiring_soon   = db.query(Grant).filter(
        Grant.status == "published",
        Grant.deadline >= date.today(),
        Grant.deadline <= date.today() + timedelta(days=30),
    ).count()
    from app.models.user import User as UserModel
    total_users = db.query(UserModel).filter(UserModel.is_admin == False).count()
    return {
        "total_grants":   total_published,
        "expiring_soon":  expiring_soon,
        "total_users":    total_users,
    }
