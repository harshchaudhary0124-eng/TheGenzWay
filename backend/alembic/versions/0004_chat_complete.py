"""Chat completion: attachments, reactions, forum join_token

Revision ID: 0004
Revises: 0003
Create Date: 2026-06-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "discussion_forums",
        sa.Column("join_token", sa.String(length=64), nullable=True),
    )
    op.create_index(
        op.f("ix_discussion_forums_join_token"),
        "discussion_forums",
        ["join_token"],
        unique=True,
    )

    op.create_table(
        "forum_attachments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("forum_id", sa.Integer(), nullable=False),
        sa.Column("message_id", sa.Integer(), nullable=True),
        sa.Column("uploader_id", sa.Integer(), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("stored_path", sa.String(length=512), nullable=False),
        sa.Column("content_type", sa.String(length=120), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["forum_id"], ["discussion_forums.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["message_id"], ["forum_messages.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["uploader_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_forum_attachments_id"), "forum_attachments", ["id"], unique=False)
    op.create_index(op.f("ix_forum_attachments_forum_id"), "forum_attachments", ["forum_id"], unique=False)
    op.create_index(op.f("ix_forum_attachments_message_id"), "forum_attachments", ["message_id"], unique=False)
    op.create_index(op.f("ix_forum_attachments_created_at"), "forum_attachments", ["created_at"], unique=False)

    op.create_table(
        "forum_reactions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("message_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("emoji", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["message_id"], ["forum_messages.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("message_id", "user_id", "emoji", name="uq_reaction_msg_user_emoji"),
    )
    op.create_index(op.f("ix_forum_reactions_id"), "forum_reactions", ["id"], unique=False)
    op.create_index(op.f("ix_forum_reactions_message_id"), "forum_reactions", ["message_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_forum_reactions_message_id"), table_name="forum_reactions")
    op.drop_index(op.f("ix_forum_reactions_id"), table_name="forum_reactions")
    op.drop_table("forum_reactions")

    op.drop_index(op.f("ix_forum_attachments_created_at"), table_name="forum_attachments")
    op.drop_index(op.f("ix_forum_attachments_message_id"), table_name="forum_attachments")
    op.drop_index(op.f("ix_forum_attachments_forum_id"), table_name="forum_attachments")
    op.drop_index(op.f("ix_forum_attachments_id"), table_name="forum_attachments")
    op.drop_table("forum_attachments")

    op.drop_index(op.f("ix_discussion_forums_join_token"), table_name="discussion_forums")
    op.drop_column("discussion_forums", "join_token")
