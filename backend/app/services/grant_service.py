from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional, Tuple
from uuid import UUID
from datetime import date, timedelta

from app.models.grant import Grant
from app.models.user import User
from app.models.pipeline import Watchlist
from app.schemas.grant import GrantSearchParams, GrantUpdate


def search_grants(db: Session, params: GrantSearchParams, current_user: Optional[User] = None):
    q = db.query(Grant).filter(Grant.status == "published")

    # Full-text keyword search
    if params.query:
        term = f"%{params.query}%"
        q = q.filter(
            or_(
                Grant.title_en.ilike(term),
                Grant.title_bn.ilike(term),
                Grant.issuing_agency.ilike(term),
                Grant.description_en.ilike(term),
            )
        )

    # Research area filter (array overlap)
    if params.research_areas:
        q = q.filter(Grant.research_areas.overlap(params.research_areas))

    # Eligibility filter
    if params.eligibility_types:
        q = q.filter(Grant.eligibility_types.overlap(params.eligibility_types))

    # Deadline filter
    if params.deadline_within_days:
        cutoff = date.today() + timedelta(days=params.deadline_within_days)
        q = q.filter(Grant.deadline <= cutoff, Grant.deadline >= date.today())

    # Funding filters
    if params.funding_min:
        q = q.filter(Grant.funding_max >= params.funding_min)
    if params.funding_max:
        q = q.filter(Grant.funding_min <= params.funding_max)

    # Agency filter
    if params.agency:
        q = q.filter(Grant.issuing_agency.ilike(f"%{params.agency}%"))

    # Sorting
    if params.sort_by == "deadline":
        q = q.order_by(Grant.deadline.asc().nullslast())
    elif params.sort_by == "funding_max":
        q = q.order_by(Grant.funding_max.desc().nullslast())
    else:
        q = q.order_by(Grant.published_at.desc())

    total = q.count()

    offset = (params.page - 1) * params.page_size
    grants = q.offset(offset).limit(params.page_size).all()

    # Annotate with user-specific data
    if current_user:
        watchlisted_ids = {
            w.grant_id for w in db.query(Watchlist).filter(Watchlist.user_id == current_user.id)
        }
        for grant in grants:
            grant.is_watchlisted = grant.id in watchlisted_ids
            grant.match_reasons = list(
                set(grant.research_areas) & set(current_user.research_interests)
            )

    return grants, total


def get_grant_by_id(db: Session, grant_id: UUID, current_user: Optional[User] = None):
    grant = db.query(Grant).filter(Grant.id == grant_id).first()
    if not grant:
        return None

    if current_user:
        wl = db.query(Watchlist).filter(
            Watchlist.user_id == current_user.id,
            Watchlist.grant_id == grant_id
        ).first()
        grant.is_watchlisted = wl is not None
        grant.match_reasons = list(
            set(grant.research_areas) & set(current_user.research_interests)
        )

    # Calculate days until deadline
    if grant.deadline:
        delta = grant.deadline - date.today()
        grant.days_until_deadline = max(0, delta.days)

    return grant


def get_matched_grants_for_user(db: Session, user: User) -> List[Grant]:
    """Find all published grants matching user's research interests — used by email alerts."""
    if not user.research_interests:
        return []
    return (
        db.query(Grant)
        .filter(
            Grant.status == "published",
            Grant.research_areas.overlap(user.research_interests),
        )
        .order_by(Grant.published_at.desc())
        .all()
    )


def update_grant(db: Session, grant: Grant, updates: GrantUpdate) -> Grant:
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(grant, field, value)
    db.commit()
    db.refresh(grant)
    return grant


def toggle_watchlist(db: Session, user: User, grant_id: UUID) -> bool:
    """Add or remove from watchlist. Returns True if now saved, False if removed."""
    existing = db.query(Watchlist).filter(
        Watchlist.user_id == user.id,
        Watchlist.grant_id == grant_id
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        return False
    else:
        entry = Watchlist(user_id=user.id, grant_id=grant_id)
        db.add(entry)
        db.commit()
        return True


def get_expiring_soon(db: Session, days: int = 30) -> List[Grant]:
    cutoff = date.today() + timedelta(days=days)
    return (
        db.query(Grant)
        .filter(
            Grant.status == "published",
            Grant.deadline >= date.today(),
            Grant.deadline <= cutoff,
        )
        .order_by(Grant.deadline.asc())
        .all()
    )
