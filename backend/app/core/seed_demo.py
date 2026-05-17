"""
Demo data seeder for quick role testing.

This is intentionally idempotent: running it again refreshes the same demo
accounts and only creates missing sample records.
"""

from datetime import date, datetime
from decimal import Decimal
from sqlalchemy import func

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.application import (
    Expense,
    FundInstallment,
    GrantApplication,
    ProjectMember,
    ResearchProject,
)
from app.models.grant import Grant
from app.models.pipeline import Source
from app.models.user import User


DEMO_PASSWORD = "DemoPass123!"


DEMO_USERS = [
    {
        "email": "godadmin@grantbd.test",
        "full_name": "GrantBD Platform Admin",
        "role": "god_admin",
        "is_admin": True,
        "research_interests": [],
    },
    {
        "email": "moderator@grantbd.test",
        "full_name": "GrantBD Moderator",
        "role": "moderator",
        "is_admin": True,
        "research_interests": [],
    },
    {
        "email": "researcher@grantbd.test",
        "full_name": "Dr. Amina Rahman",
        "role": "researcher",
        "is_admin": False,
        "institution": "University of Dhaka",
        "department": "Department of Soil, Water and Environment",
        "designation": "Assistant Professor",
        "academic_degree": "PhD",
        "orcid_id": "0000-0002-1234-5678",
        "research_interests": ["agriculture", "climate_environment", "public_health"],
    },
    {
        "email": "org@grantbd.test",
        "full_name": "BARC Grants Office",
        "role": "org",
        "is_admin": False,
        "account_status": "active",
        "org_verified": True,
        "org_name": "Bangladesh Agricultural Research Council",
        "org_type": "government",
        "org_website": "https://barc.gov.bd",
        "org_address": "Farmgate, Dhaka",
        "org_description": "National coordination body for agricultural research funding.",
        "research_interests": [],
    },
]


def upsert_user(db, data: dict) -> User:
    email = data["email"].lower()
    user = db.query(User).filter(func.lower(User.email) == email).first()
    if not user:
        user = User(email=email, hashed_password=hash_password(DEMO_PASSWORD), full_name=data["full_name"])
        db.add(user)

    user.hashed_password = hash_password(DEMO_PASSWORD)
    user.full_name = data["full_name"]
    user.role = data["role"]
    user.is_admin = data.get("is_admin", False)
    user.is_verified = True
    user.account_status = data.get("account_status", "active")
    user.email_alerts_enabled = data.get("role") == "researcher"
    user.preferred_language = "en"
    user.institution = data.get("institution")
    user.department = data.get("department")
    user.designation = data.get("designation")
    user.academic_degree = data.get("academic_degree")
    user.orcid_id = data.get("orcid_id")
    user.research_interests = data.get("research_interests", [])
    user.publication_count = data.get("publication_count", 7)
    user.org_name = data.get("org_name")
    user.org_type = data.get("org_type")
    user.org_website = data.get("org_website")
    user.org_address = data.get("org_address")
    user.org_description = data.get("org_description")
    user.org_verified = data.get("org_verified", False)
    return user


def get_source(db) -> Source:
    source = db.query(Source).filter(Source.name == "Demo Seed").first()
    if source:
        return source
    source = Source(name="Demo Seed", url="https://grantbd.test/demo", source_type="demo")
    db.add(source)
    db.flush()
    return source


def upsert_grants(db, source: Source, org: User) -> tuple[Grant, Grant]:
    published = db.query(Grant).filter(Grant.title_en == "Demo Climate Smart Agriculture Grant 2026").first()
    if not published:
        published = Grant(title_en="Demo Climate Smart Agriculture Grant 2026", issuing_agency=org.org_name)
        db.add(published)

    published.source_id = source.id
    published.org_publisher_id = org.id
    published.agency_type = "government"
    published.deadline = date(2026, 8, 31)
    published.published_at = datetime.utcnow()
    published.funding_min = Decimal("500000")
    published.funding_max = Decimal("2000000")
    published.currency = "BDT"
    published.eligibility_types = ["faculty", "researcher", "scientist"]
    published.research_areas = ["agriculture", "climate_environment", "crop_science"]
    published.description_en = (
        "Demo grant for climate smart agricultural research in Bangladesh. "
        "Researchers can use this listing to test browsing, applications, and project tracking."
    )
    published.source_url = "https://grantbd.test/demo/climate-smart-agriculture"
    published.status = "published"
    published.ai_confidence_score = 1.0
    published.ai_extracted_fields = {"demo_seed_conf": 1.0}

    draft = db.query(Grant).filter(Grant.title_en == "Demo AI Extracted BARC Research Call").first()
    if not draft:
        draft = Grant(title_en="Demo AI Extracted BARC Research Call", issuing_agency=org.org_name)
        db.add(draft)

    draft.source_id = source.id
    draft.agency_type = "government_notice"
    draft.deadline = date(2026, 9, 15)
    draft.funding_min = Decimal("300000")
    draft.funding_max = Decimal("1200000")
    draft.currency = "BDT"
    draft.eligibility_types = ["faculty", "scientist"]
    draft.research_areas = ["agriculture", "food_technology"]
    draft.description_en = (
        "Demo pending-review grant representing a notice extracted from an uploaded document. "
        "Moderators can approve or reject it from the review queue."
    )
    draft.status = "pending_review"
    draft.ai_confidence_score = 0.86
    draft.ai_extracted_fields = {
        "deadline_conf": 0.9,
        "funding_max_conf": 0.82,
        "research_areas_conf": 0.86,
    }
    return published, draft


def upsert_project_flow(db, grant: Grant, researcher: User, reviewer: User) -> None:
    app = (
        db.query(GrantApplication)
        .filter(GrantApplication.grant_id == grant.id, GrantApplication.applicant_id == researcher.id)
        .first()
    )
    if not app:
        app = GrantApplication(
            grant_id=grant.id,
            applicant_id=researcher.id,
            project_title="Climate Resilient Rice Field Monitoring",
            abstract="A demo awarded application for testing GrantBD project and expense tracking.",
        )
        db.add(app)

    app.status = "awarded"
    app.objectives = "Track soil moisture, fertilizer use, and field-level climate adaptation outcomes."
    app.methodology = "Field survey, low-cost sensors, and seasonal yield comparison."
    app.expected_outcomes = "A reusable field monitoring method for climate resilient agriculture."
    app.research_areas = ["agriculture", "climate_environment"]
    app.co_investigators = [
        {
            "name": "Farhana Karim",
            "institution": "Bangladesh Agricultural University",
            "designation": "Research Associate",
            "email": "farhana@example.test",
        }
    ]
    app.project_start_date = "2026-07-01"
    app.project_end_date = "2027-06-30"
    app.budget_total_requested = Decimal("1200000")
    app.budget_breakdown = {
        "personnel": 300000,
        "equipment": 450000,
        "travel": 150000,
        "overhead": 100000,
        "other": 200000,
    }
    app.reviewed_by_id = reviewer.id
    app.reviewed_at = datetime.utcnow()
    app.awarded_amount = Decimal("1200000")
    app.submitted_at = datetime.utcnow()
    db.flush()

    project = db.query(ResearchProject).filter(ResearchProject.application_id == app.id).first()
    if not project:
        project = ResearchProject(
            application_id=app.id,
            grant_id=grant.id,
            pi_id=researcher.id,
            title=app.project_title,
            total_budget=app.awarded_amount,
        )
        db.add(project)

    project.description = app.abstract
    project.currency = "BDT"
    project.budget_breakdown = app.budget_breakdown
    project.start_date = app.project_start_date
    project.end_date = app.project_end_date
    project.status = "active"
    project.reports = [
        {"type": "progress", "status": "not_submitted", "due_date": "2026-12-31"},
        {"type": "final", "status": "not_submitted", "due_date": "2027-06-30"},
    ]
    db.flush()

    member = db.query(ProjectMember).filter(ProjectMember.project_id == project.id, ProjectMember.email == "farhana@example.test").first()
    if not member:
        member = ProjectMember(
            project_id=project.id,
            name="Farhana Karim",
            email="farhana@example.test",
            role="research_assistant",
        )
        db.add(member)
        db.flush()

    if db.query(FundInstallment).filter(FundInstallment.project_id == project.id).count() == 0:
        db.add_all([
            FundInstallment(
                project_id=project.id,
                installment_number="1st",
                amount=Decimal("600000"),
                received_date="2026-07-15",
                bank_ref="DEMO-BANK-001",
                note="Initial release",
            ),
            FundInstallment(
                project_id=project.id,
                installment_number="2nd",
                amount=Decimal("600000"),
                received_date=None,
                bank_ref=None,
                note="Scheduled after progress report",
            ),
        ])

    if db.query(Expense).filter(Expense.project_id == project.id).count() == 0:
        db.add_all([
            Expense(
                project_id=project.id,
                member_id=member.id,
                category="equipment",
                description="Soil moisture sensor kits",
                amount=Decimal("85000"),
                expense_date="2026-07-20",
                vendor="Demo Scientific Supplies",
                status="approved",
                approved_by_id=researcher.id,
                approved_at=datetime.utcnow(),
                note="Demo approved expense",
            ),
            Expense(
                project_id=project.id,
                member_id=member.id,
                category="travel",
                description="Field visit to pilot plots",
                amount=Decimal("12500"),
                expense_date="2026-08-02",
                vendor="Demo Transport",
                status="pending",
                note="Demo pending expense",
            ),
        ])


def seed_demo() -> None:
    db = SessionLocal()
    try:
        users = {item["role"]: upsert_user(db, item) for item in DEMO_USERS}
        db.flush()

        source = get_source(db)
        published_grant, _draft_grant = upsert_grants(db, source, users["org"])
        upsert_project_flow(db, published_grant, users["researcher"], users["moderator"])
        db.commit()
        print("Demo data ready")
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo()
