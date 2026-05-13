"""
Admin Seeder
============
Creates the first admin user if none exists.
Reads credentials from environment variables.

Run once after first deploy:
  railway run python -m app.core.seed_admin

Or set these env vars on Railway and it auto-runs on first start
(see Dockerfile CMD option below).

Environment variables:
  ADMIN_EMAIL     (required)
  ADMIN_PASSWORD  (required)
  ADMIN_NAME      (optional, default "Admin")
"""

import os
import sys
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import hash_password


def seed_admin():
    email = os.environ.get("ADMIN_EMAIL")
    password = os.environ.get("ADMIN_PASSWORD")
    name = os.environ.get("ADMIN_NAME", "Admin")

    if not email or not password:
        print("⚠ ADMIN_EMAIL and ADMIN_PASSWORD not set — skipping admin seed")
        return

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            if not existing.is_admin:
                existing.is_admin = True
                db.commit()
                print(f"✓ Promoted existing user {email} to admin")
            else:
                print(f"✓ Admin {email} already exists")
            return

        admin = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=name,
            is_admin=True,
            is_verified=True,
            email_alerts_enabled=False,  # admin doesn't need grant alerts
        )
        db.add(admin)
        db.commit()
        print(f"✓ Admin user created: {email}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()
