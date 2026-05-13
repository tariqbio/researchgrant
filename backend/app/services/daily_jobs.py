"""
Daily Jobs Runner
=================
Runs all scheduled jobs in one shot. Wire to Railway cron:
  Command:  python -m app.services.daily_jobs
  Schedule: 0 1 * * *  (1am UTC = 7am Bangladesh time)
"""

import logging
from app.db.session import SessionLocal
from app.services.reminder_service import send_deadline_reminders
from app.services.expiry_service import expire_past_deadline_grants

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_all():
    db = SessionLocal()
    try:
        logger.info("── Daily jobs starting ──")

        # 1. Expire past-deadline grants first
        expired = expire_past_deadline_grants(db)
        logger.info(f"Expiry: {expired} grants marked expired")

        # 2. Send 7-day reminders
        sent_7 = send_deadline_reminders(db, days_before=7)
        logger.info(f"Reminders (7-day): {sent_7} sent")

        # 3. Send 1-day reminders
        sent_1 = send_deadline_reminders(db, days_before=1)
        logger.info(f"Reminders (1-day): {sent_1} sent")

        logger.info("── Daily jobs complete ──")
        print(f"✓ Expired: {expired} | 7-day reminders: {sent_7} | 1-day reminders: {sent_1}")
    finally:
        db.close()


if __name__ == "__main__":
    run_all()
