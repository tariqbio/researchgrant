"""
Alert Service
=============
Sends email alerts to researchers when a new grant matches their interests.
Also exposes a generic send_email() used by reminder_service.
"""

from sqlalchemy.orm import Session
from sqlalchemy import cast
from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY
from sqlalchemy import String
from typing import List
from datetime import date
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from app.core.config import settings
from app.models.user import User
from app.models.grant import Grant
from app.models.pipeline import AlertLog


RESEARCH_AREA_LABELS = {
    "biotechnology": "Biotechnology", "life_sciences": "Life Sciences",
    "agriculture": "Agriculture", "crop_science": "Crop Science",
    "soil_science": "Soil Science", "food_technology": "Food Technology",
    "fisheries": "Fisheries", "veterinary": "Veterinary Science",
    "engineering": "Engineering", "civil_engineering": "Civil Engineering",
    "mechanical_engineering": "Mechanical Engineering",
    "electrical_engineering": "Electrical Engineering",
    "chemical_engineering": "Chemical Engineering", "ict": "ICT",
    "software_engineering": "Software Engineering", "data_science": "Data Science",
    "ai_ml": "AI & Machine Learning", "climate_environment": "Climate & Environment",
    "water_resources": "Water Resources", "renewable_energy": "Renewable Energy",
    "social_sciences": "Social Sciences", "economics": "Economics",
    "education": "Education", "public_health": "Public Health",
    "medicine": "Medicine", "pharmacy": "Pharmacy",
    "chemistry": "Chemistry", "physics": "Physics",
    "mathematics": "Mathematics", "urban_planning": "Urban Planning",
    "architecture": "Architecture", "law": "Law", "humanities": "Humanities",
}


def slug_to_label(slug: str) -> str:
    return RESEARCH_AREA_LABELS.get(slug, slug.replace("_", " ").title())


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Generic email sender via SendGrid. Used by alert_service and reminder_service."""
    if not settings.SENDGRID_API_KEY:
        print(f"[EMAIL SKIPPED — no SENDGRID_API_KEY] To: {to_email} | Subject: {subject}")
        return False
    message = Mail(
        from_email=(settings.EMAIL_FROM, settings.EMAIL_FROM_NAME),
        to_emails=to_email,
        subject=subject,
        html_content=html_body,
    )
    try:
        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = sg.send(message)
        return response.status_code in (200, 202)
    except Exception as e:
        print(f"SendGrid error for {to_email}: {e}")
        return False


def render_tags_html(research_areas: list, matched: list) -> str:
    tags = []
    for area in research_areas:
        label = slug_to_label(area)
        if area in matched:
            tags.append(
                f'<span style="display:inline-block;background:#E1F5EE;color:#085041;'
                f'font-size:12px;padding:3px 10px;border-radius:20px;margin:0 4px 4px 0;'
                f'font-weight:500;">✓ {label}</span>'
            )
        else:
            tags.append(
                f'<span style="display:inline-block;background:#EEEDFE;color:#3C3489;'
                f'font-size:12px;padding:3px 10px;border-radius:20px;margin:0 4px 4px 0;">'
                f'{label}</span>'
            )
    return "".join(tags)


def build_email_html(user: User, grant: Grant, matched_areas: list) -> str:
    match_labels = ", ".join(slug_to_label(a) for a in matched_areas)
    deadline_str = grant.deadline.strftime("%d %B %Y") if grant.deadline else ""
    days_left = str(max(0, (grant.deadline - date.today()).days)) if grant.deadline else ""
    funding_str = (
        f"৳{int(grant.funding_min):,} – ৳{int(grant.funding_max):,}"
        if grant.funding_min and grant.funding_max
        else f"Up to ৳{int(grant.funding_max):,}" if grant.funding_max
        else "See grant details"
    )
    tags_html = render_tags_html(grant.research_areas or [], matched_areas)
    grant_url = f"https://grantbd.com/grants/{grant.id}"
    unsubscribe_url = "https://grantbd.com/profile"

    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>New grant match — GrantBD</title></head>
<body style="margin:0;padding:0;background:#f5f5f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding-bottom:20px;text-align:center;">
          <span style="font-size:20px;font-weight:600;color:#111110;">Grant<span style="color:#1D9E75;">BD</span></span>
        </td></tr>
        <tr><td style="background:#fff;border-radius:16px;border:1px solid #e8e6df;overflow:hidden;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:#1D9E75;padding:20px 28px;">
              <p style="margin:0;font-size:12px;color:#9FE1CB;letter-spacing:.06em;text-transform:uppercase;">New grant match</p>
              <p style="margin:6px 0 0;font-size:13px;color:#E1F5EE;">Matched your interest in <strong style="color:#fff;">{match_labels}</strong></p>
            </td></tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:24px 28px;">
              <p style="margin:0 0 6px;font-size:12px;color:#9B9A94;font-weight:500;">{grant.issuing_agency}</p>
              <h1 style="margin:0 0 20px;font-size:20px;font-weight:600;color:#111110;line-height:1.3;">{grant.title_en}</h1>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f2;border-radius:10px;margin-bottom:20px;">
                <tr>
                  <td style="padding:14px 16px;border-right:1px solid #e8e6df;width:50%;">
                    <p style="margin:0 0 3px;font-size:11px;color:#9B9A94;text-transform:uppercase;">Deadline</p>
                    <p style="margin:0;font-size:15px;font-weight:600;color:#111110;">{deadline_str or 'Not specified'}</p>
                    {f"<p style='margin:3px 0 0;font-size:12px;color:#D85A30;font-weight:500;'>{days_left} days remaining</p>" if days_left else ""}
                  </td>
                  <td style="padding:14px 16px;width:50%;">
                    <p style="margin:0 0 3px;font-size:11px;color:#9B9A94;text-transform:uppercase;">Funding</p>
                    <p style="margin:0;font-size:15px;font-weight:600;color:#111110;">{funding_str}</p>
                  </td>
                </tr>
              </table>
              {f"<p style='margin:0 0 20px;font-size:14px;color:#3d3d3a;line-height:1.7;'>{grant.description_en}</p>" if grant.description_en else ""}
              <p style="margin:0 0 10px;font-size:11px;color:#9B9A94;text-transform:uppercase;">Research areas</p>
              <div style="margin-bottom:24px;">{tags_html}</div>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr><td style="border-radius:10px;background:#1D9E75;">
                  <a href="{grant_url}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#fff;text-decoration:none;">View grant details →</a>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9B9A94;">
            <a href="{unsubscribe_url}" style="color:#9B9A94;text-decoration:underline;">Manage alert settings</a>
            &nbsp;·&nbsp;
            <a href="https://grantbd.com" style="color:#9B9A94;text-decoration:underline;">GrantBD.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def find_matching_users(db: Session, grant: Grant) -> List[User]:
    """
    Find users whose research_interests overlap with the grant's research_areas.
    Uses PostgreSQL's && (array overlap) operator via SQLAlchemy cast.
    """
    if not grant.research_areas:
        return []
    # Correct SQLAlchemy syntax for PostgreSQL ARRAY overlap (&&)
    return (
        db.query(User)
        .filter(
            User.email_alerts_enabled == True,
            # Include all verified users AND users registered via normal flow
            # (is_verified used for email-verified accounts; we don't enforce email
            # verification in v1, so we match anyone who hasn't explicitly disabled alerts)
            User.research_interests.overlap(
                cast(grant.research_areas, PG_ARRAY(String))
            ),
        )
        .all()
    )


def already_alerted(db: Session, user_id, grant_id) -> bool:
    return db.query(AlertLog).filter(
        AlertLog.user_id == user_id,
        AlertLog.grant_id == grant_id,
    ).first() is not None


def trigger_alerts_for_grant(db: Session, grant: Grant) -> int:
    users = find_matching_users(db, grant)
    sent = 0
    for user in users:
        if already_alerted(db, user.id, grant.id):
            continue
        matched_areas = list(set(grant.research_areas or []) & set(user.research_interests or []))
        log = AlertLog(
            user_id=user.id,
            grant_id=grant.id,
            match_reason=",".join(matched_areas),
            email_status="queued",
        )
        db.add(log)
        db.commit()
        db.refresh(log)

        html = build_email_html(user, grant, matched_areas)
        success = send_email(
            to_email=user.email,
            subject=f"New grant match: {grant.title_en}",
            html_body=html,
        )
        log.email_status = "sent" if success else "failed"
        db.commit()
        if success:
            sent += 1
    return sent
