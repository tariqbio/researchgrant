"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-05-13
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
import uuid

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:

    # ── users ────────────────────────────────────────────────────────────────
    op.create_table(
        'users',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('institution', sa.String(), nullable=True),
        sa.Column('designation', sa.String(), nullable=True),
        sa.Column('research_interests', ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('preferred_language', sa.String(), nullable=False, server_default='en'),
        sa.Column('email_alerts_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_admin', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # ── sources ──────────────────────────────────────────────────────────────
    op.create_table(
        'sources',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('url', sa.String(), nullable=True),
        sa.Column('source_type', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_checked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── ingestion_jobs ───────────────────────────────────────────────────────
    op.create_table(
        'ingestion_jobs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('source_id', UUID(as_uuid=True), sa.ForeignKey('sources.id'), nullable=True),
        sa.Column('raw_file_path', sa.String(), nullable=True),
        sa.Column('raw_url', sa.String(), nullable=True),
        sa.Column('raw_text_path', sa.String(), nullable=True),
        sa.Column('ocr_engine', sa.String(), nullable=True),
        sa.Column('ocr_confidence', sa.Float(), nullable=True),
        sa.Column('ai_model', sa.String(), nullable=True),
        sa.Column('ai_extracted_json', JSONB(), nullable=True),
        sa.Column('job_status', sa.String(), nullable=False, server_default='pending_ocr'),
        sa.Column('failure_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('ix_ingestion_jobs_status', 'ingestion_jobs', ['job_status'])

    # ── grants ───────────────────────────────────────────────────────────────
    op.create_table(
        'grants',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('source_id', UUID(as_uuid=True), sa.ForeignKey('sources.id'), nullable=True),
        sa.Column('reviewed_by', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('ingestion_job_id', UUID(as_uuid=True), sa.ForeignKey('ingestion_jobs.id'), nullable=True),
        sa.Column('title_en', sa.String(), nullable=False),
        sa.Column('title_bn', sa.String(), nullable=True),
        sa.Column('issuing_agency', sa.String(), nullable=False),
        sa.Column('agency_type', sa.String(), nullable=True),
        sa.Column('deadline', sa.Date(), nullable=True),
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('funding_min', sa.Numeric(15, 2), nullable=True),
        sa.Column('funding_max', sa.Numeric(15, 2), nullable=True),
        sa.Column('currency', sa.String(), nullable=False, server_default='BDT'),
        sa.Column('eligibility_types', ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('research_areas', ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('description_en', sa.Text(), nullable=True),
        sa.Column('description_bn', sa.Text(), nullable=True),
        sa.Column('source_url', sa.String(), nullable=True),
        sa.Column('original_pdf_path', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='pending_review'),
        sa.Column('ai_confidence_score', sa.Float(), nullable=True),
        sa.Column('ai_extracted_fields', JSONB(), nullable=True),
        sa.Column('admin_note', sa.Text(), nullable=True),
    )
    op.create_index('ix_grants_status', 'grants', ['status'])
    # GIN index for fast array overlap queries (the matching engine)
    op.execute(
        "CREATE INDEX ix_grants_research_areas_gin ON grants USING GIN (research_areas)"
    )
    op.execute(
        "CREATE INDEX ix_users_research_interests_gin ON users USING GIN (research_interests)"
    )

    # ── watchlist ─────────────────────────────────────────────────────────────
    op.create_table(
        'watchlist',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('grant_id', UUID(as_uuid=True), sa.ForeignKey('grants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('saved_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint('user_id', 'grant_id', name='uq_watchlist_user_grant'),
    )

    # ── alert_logs ────────────────────────────────────────────────────────────
    op.create_table(
        'alert_logs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('grant_id', UUID(as_uuid=True), sa.ForeignKey('grants.id'), nullable=False),
        sa.Column('match_reason', sa.String(), nullable=True),
        sa.Column('email_status', sa.String(), nullable=False, server_default='queued'),
        sa.Column('sendgrid_message_id', sa.String(), nullable=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint('user_id', 'grant_id', name='uq_alert_log_user_grant'),
    )

    # ── community_submissions ─────────────────────────────────────────────────
    op.create_table(
        'community_submissions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('submitted_by', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('reviewed_by', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('source_url', sa.String(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_community_submissions_status', 'community_submissions', ['status'])

    # ── seed: default sources ─────────────────────────────────────────────────
    op.execute("""
        INSERT INTO sources (id, name, url, source_type) VALUES
        (gen_random_uuid(), 'University Grants Commission (UGC)', 'https://ugc.gov.bd', 'government_site'),
        (gen_random_uuid(), 'Bangladesh Agricultural Research Council (BARC)', 'https://barc.gov.bd', 'government_site'),
        (gen_random_uuid(), 'Bangladesh Council of Scientific & Industrial Research (BCSIR)', 'https://bcsir.gov.bd', 'government_site'),
        (gen_random_uuid(), 'Ministry of Science & Technology', 'https://most.gov.bd', 'government_site'),
        (gen_random_uuid(), 'Bangladesh Rice Research Institute (BRRI)', 'https://brri.gov.bd', 'government_site'),
        (gen_random_uuid(), 'The Daily Star (grant notices)', 'https://thedailystar.net', 'newspaper'),
        (gen_random_uuid(), 'Prothom Alo (grant notices)', 'https://prothomalo.com', 'newspaper'),
        (gen_random_uuid(), 'Community Submission', NULL, 'community')
    """)


def downgrade() -> None:
    op.drop_table('community_submissions')
    op.drop_table('alert_logs')
    op.drop_table('watchlist')
    op.drop_table('grants')
    op.drop_table('ingestion_jobs')
    op.drop_table('sources')
    op.drop_table('users')
