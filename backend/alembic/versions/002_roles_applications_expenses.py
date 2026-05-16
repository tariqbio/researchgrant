"""roles applications expenses

Revision ID: 002
Revises: 001
Create Date: 2026-05-16
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
import uuid

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Add new columns to users ──────────────────────────────────────────────
    op.add_column('users', sa.Column('role', sa.String(), nullable=False, server_default='researcher'))
    op.add_column('users', sa.Column('account_status', sa.String(), nullable=False, server_default='active'))
    op.add_column('users', sa.Column('department', sa.String(), nullable=True))
    op.add_column('users', sa.Column('academic_degree', sa.String(), nullable=True))
    op.add_column('users', sa.Column('orcid_id', sa.String(), nullable=True))
    op.add_column('users', sa.Column('phone', sa.String(), nullable=True))
    op.add_column('users', sa.Column('publication_count', sa.Integer(), nullable=True, server_default='0'))
    op.add_column('users', sa.Column('org_name', sa.String(), nullable=True))
    op.add_column('users', sa.Column('org_type', sa.String(), nullable=True))
    op.add_column('users', sa.Column('org_website', sa.String(), nullable=True))
    op.add_column('users', sa.Column('org_address', sa.String(), nullable=True))
    op.add_column('users', sa.Column('org_description', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('org_verified', sa.Boolean(), nullable=False, server_default='false'))

    # Set god_admin role for existing admin users
    op.execute("UPDATE users SET role = 'god_admin' WHERE is_admin = true")

    # ── Add new columns to grants ─────────────────────────────────────────────
    op.add_column('grants', sa.Column('org_publisher_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True))
    op.add_column('grants', sa.Column('requires_proposal_pdf', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('grants', sa.Column('requires_cv', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('grants', sa.Column('requires_budget_breakdown', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('grants', sa.Column('application_instructions', sa.Text(), nullable=True))
    op.add_column('grants', sa.Column('max_budget_requested', sa.Numeric(15, 2), nullable=True))

    # ── grant_applications ────────────────────────────────────────────────────
    op.create_table(
        'grant_applications',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('grant_id', UUID(as_uuid=True), sa.ForeignKey('grants.id'), nullable=False),
        sa.Column('applicant_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='draft'),
        sa.Column('project_title', sa.String(), nullable=False),
        sa.Column('abstract', sa.Text(), nullable=False),
        sa.Column('objectives', sa.Text(), nullable=True),
        sa.Column('methodology', sa.Text(), nullable=True),
        sa.Column('expected_outcomes', sa.Text(), nullable=True),
        sa.Column('research_areas', ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('co_investigators', JSONB(), nullable=True),
        sa.Column('project_start_date', sa.String(), nullable=True),
        sa.Column('project_end_date', sa.String(), nullable=True),
        sa.Column('milestones', JSONB(), nullable=True),
        sa.Column('budget_total_requested', sa.Numeric(15, 2), nullable=True),
        sa.Column('budget_breakdown', JSONB(), nullable=True),
        sa.Column('proposal_pdf_path', sa.String(), nullable=True),
        sa.Column('cv_pdf_path', sa.String(), nullable=True),
        sa.Column('supporting_docs_paths', JSONB(), nullable=True),
        sa.Column('reviewed_by_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('reviewer_note', sa.Text(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('awarded_amount', sa.Numeric(15, 2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_grant_applications_status', 'grant_applications', ['status'])
    op.create_index('ix_grant_applications_grant_id', 'grant_applications', ['grant_id'])
    op.create_index('ix_grant_applications_applicant_id', 'grant_applications', ['applicant_id'])

    # ── research_projects ─────────────────────────────────────────────────────
    op.create_table(
        'research_projects',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('application_id', UUID(as_uuid=True), sa.ForeignKey('grant_applications.id'), nullable=True),
        sa.Column('grant_id', UUID(as_uuid=True), sa.ForeignKey('grants.id'), nullable=False),
        sa.Column('pi_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('total_budget', sa.Numeric(15, 2), nullable=False),
        sa.Column('currency', sa.String(), nullable=False, server_default='BDT'),
        sa.Column('budget_breakdown', JSONB(), nullable=True),
        sa.Column('start_date', sa.String(), nullable=True),
        sa.Column('end_date', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='active'),
        sa.Column('reports', JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )

    # ── project_members ───────────────────────────────────────────────────────
    op.create_table(
        'project_members',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('project_id', UUID(as_uuid=True), sa.ForeignKey('research_projects.id'), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('role', sa.String(), nullable=True),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── fund_installments ─────────────────────────────────────────────────────
    op.create_table(
        'fund_installments',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('project_id', UUID(as_uuid=True), sa.ForeignKey('research_projects.id'), nullable=False),
        sa.Column('installment_number', sa.String(), nullable=False),
        sa.Column('amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('received_date', sa.String(), nullable=True),
        sa.Column('bank_ref', sa.String(), nullable=True),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── expenses ──────────────────────────────────────────────────────────────
    op.create_table(
        'expenses',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('project_id', UUID(as_uuid=True), sa.ForeignKey('research_projects.id'), nullable=False),
        sa.Column('member_id', UUID(as_uuid=True), sa.ForeignKey('project_members.id'), nullable=True),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('currency', sa.String(), nullable=False, server_default='BDT'),
        sa.Column('expense_date', sa.String(), nullable=False),
        sa.Column('receipt_path', sa.String(), nullable=True),
        sa.Column('vendor', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('approved_by_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('ix_expenses_project_id', 'expenses', ['project_id'])
    op.create_index('ix_expenses_status', 'expenses', ['status'])


def downgrade() -> None:
    op.drop_table('expenses')
    op.drop_table('fund_installments')
    op.drop_table('project_members')
    op.drop_table('research_projects')
    op.drop_table('grant_applications')
    op.drop_column('grants', 'max_budget_requested')
    op.drop_column('grants', 'application_instructions')
    op.drop_column('grants', 'requires_budget_breakdown')
    op.drop_column('grants', 'requires_cv')
    op.drop_column('grants', 'requires_proposal_pdf')
    op.drop_column('grants', 'org_publisher_id')
    for col in ['role','account_status','department','academic_degree','orcid_id',
                'phone','publication_count','org_name','org_type','org_website',
                'org_address','org_description','org_verified']:
        op.drop_column('users', col)
