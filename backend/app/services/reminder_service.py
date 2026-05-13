"""
Deadline Reminder Service
=========================
Run daily via Railway Cron Job:
  Command:  python -m app.services.reminder_service
  Schedule: 0 1 * * *  (1am UTC = 7am Bangladesh)
"""

import logging
from datetime import date, timedelta
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.grant import Grant
from app.models.pipeline import Watchlist
from app.models.user import User
from app.services.alert_service import send_email   # ← now correctly imported

logger = logging.getLogger(__name__)


def _reminder_html(grant, user, days_before: int) -> str:
    urgency_color = "#dc2626" if days_before == 1 else "#d97706"
    urgency_label = "TOMORROW" if days_before == 1 else f"{days_before} DAYS LEFT"
    return f"""
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#fff;
                border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#1e3a5f;padding:24px 28px;">
        <p style="color:#93c5fd;margin:0;font-size:13px;">GRANTBD · DEADLINE REMINDER</p>
        <h1 style="color:#fff;margin:8px 0 0;font-size:20px;">Application closing soon</h1>
      </div>
      <div style="padding:24px 28px;">
        <div style="background:{urgency_color}18;border-left:4px solid {urgency_color};
                    padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:20px;">
          <p style="color:{urgency_color};font-weight:700;margin:0;">
            ⏰ {urgency_label} — {grant.deadline}
          </p>
        </div>
        <h2 style="font-size:17px;color:#111827;margin:0 0 6px;">{grant.title_en}</h2>
        <p style="color:#6b7280;font-size:13px;margin:0 0 16px;">{grant.issuing_agency}</p>
        <a href="https://grantbd.com/grants/{grant.id}"
           style="display:inline-block;background:#1D9E75;color:#fff;padding:10px 22px;
                  border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
          View Grant &amp; Apply →
        </a>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0 16px;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">
          You saved this grant to your watchlist.
          <a href="https://grantbd.com/grants/{grant.id}" style="color:#9ca3af;">Remove</a>
        </p>
      </div>
    </div>"""


def send_deadline_reminders(db: Session, days_before: int) -> int:
    target_date = date.today() + timedelta(days=days_before)
    grants = (
        db.query(Grant)
        .filter(Grant.status == "published", Grant.deadline == target_date)
        .all()
    )
    sent = 0
    for grant in grants:
        entries = db.query(Watchlist).filter(Watchlist.grant_id == grant.id).all()
        for entry in entries:
            user = db.query(User).filter(User.id == entry.user_id).first()
            if not user or not user.email:
                continue
            subject = (
                f"⏰ Deadline {'tomorrow' if days_before == 1 else f'in {days_before} days'}: "
                f"{grant.title_en}"
            )
            ok = send_email(user.email, subject, _reminder_html(grant, user, days_before))
            if ok:
                sent += 1
    return sent


def expire_past_grants(db: Session) -> int:
    """Mark published grants whose deadline has passed as 'expired'."""
    result = (
        db.query(Grant)
        .filter(Grant.status == "published", Grant.deadline < date.today())
        .all()
    )
    count = len(result)
    for grant in result:
        grant.status = "expired"
    db.commit()
    return count


def run_daily():
    db = SessionLocal()
    try:
        expired = expire_past_grants(db)
        sent_7 = send_deadline_reminders(db, days_before=7)
        sent_1 = send_deadline_reminders(db, days_before=1)
        print(f"✓ Expired: {expired} grants")
        print(f"✓ Reminders: {sent_7} (7-day) + {sent_1} (1-day) sent")
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_daily()
