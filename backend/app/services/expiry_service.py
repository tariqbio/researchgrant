"""
Grant Auto-Expiry Service
=========================
Marks published grants as "expired" once their deadline has passed.

Run daily alongside the reminder cron:
  python -m app.services.expiry_service

Or combine with reminder_service into a single daily_jobs.py.
"""

import logging
from datetime import date
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.grant import Grant

logger = logging.getLogger(__name__)


def expire_past_deadline_grants(db: Session) -> int:
    """
    Find all published grants whose deadline has passed and mark them expired.
    Returns count of grants expired.
    """
    today = date.today()
    expired = (
        db.query(Grant)
        .filter(
            Grant.status == "published",
            Grant.deadline < today,
            Grant.deadline.isnot(None),
        )
        .all()
    )
    for grant in expired:
        grant.status = "expired"
    db.commit()
    logger.info(f"Expired {len(expired)} grants past their deadline")
    return len(expired)


def run():
    db = SessionLocal()
    try:
        count = expire_past_deadline_grants(db)
        print(f"✓ Expired {count} grants")
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()
