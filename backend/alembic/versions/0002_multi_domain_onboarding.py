"""Multi-domain onboarding: composite PK (id, domain) in user_onboarding

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-23

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add onboarding columns to users (were added via raw ALTER in SQLite dev path)
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(
            sa.Column("onboarding_completed", sa.Boolean(), nullable=False, server_default="false")
        )
        batch_op.add_column(
            sa.Column("onboarding_answers", sa.JSON(), nullable=True, server_default="{}")
        )

    # Create user_onboarding.  The `id` column is the same value as users.id —
    # no separate surrogate key.  Composite PK (id, domain) enforces one row per user/domain.
    op.create_table(
        "user_onboarding",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("domain", sa.String(100), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("answer_1", sa.String(500), nullable=False),
        sa.Column("answer_2", sa.String(500), nullable=False),
        sa.Column("answer_3", sa.String(500), nullable=False),
        sa.Column("answer_4", sa.String(500), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", "domain"),
    )
    op.create_index("ix_user_onboarding_id", "user_onboarding", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_user_onboarding_id", table_name="user_onboarding")
    op.drop_table("user_onboarding")
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("onboarding_answers")
        batch_op.drop_column("onboarding_completed")
