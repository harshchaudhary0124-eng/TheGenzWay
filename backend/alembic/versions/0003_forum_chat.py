"""Forum chat: forum_messages + forum_read_states

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "forum_messages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("forum_id", sa.Integer(), nullable=False),
        sa.Column("sender_id", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("reply_to_id", sa.Integer(), nullable=True),
        sa.Column("is_edited", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["forum_id"], ["discussion_forums.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["sender_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reply_to_id"], ["forum_messages.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_forum_messages_id"), "forum_messages", ["id"], unique=False)
    op.create_index(op.f("ix_forum_messages_forum_id"), "forum_messages", ["forum_id"], unique=False)
    op.create_index(op.f("ix_forum_messages_sender_id"), "forum_messages", ["sender_id"], unique=False)
    op.create_index(op.f("ix_forum_messages_created_at"), "forum_messages", ["created_at"], unique=False)
    op.create_index("ix_forum_messages_forum_id_id", "forum_messages", ["forum_id", "id"], unique=False)

    op.create_table(
        "forum_read_states",
        sa.Column("forum_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("last_read_message_id", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["forum_id"], ["discussion_forums.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("forum_id", "user_id"),
    )


def downgrade() -> None:
    op.drop_table("forum_read_states")
    op.drop_index("ix_forum_messages_forum_id_id", table_name="forum_messages")
    op.drop_index(op.f("ix_forum_messages_created_at"), table_name="forum_messages")
    op.drop_index(op.f("ix_forum_messages_sender_id"), table_name="forum_messages")
    op.drop_index(op.f("ix_forum_messages_forum_id"), table_name="forum_messages")
    op.drop_index(op.f("ix_forum_messages_id"), table_name="forum_messages")
    op.drop_table("forum_messages")
