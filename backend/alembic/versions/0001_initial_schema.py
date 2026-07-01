"""Clean baseline: full TheGenzWay schema (users, onboarding, forums, chat).

Revision ID: 0001
Revises:
Create Date: 2026-06-29

This single baseline supersedes the previous partial migration chain
(0001..0004), which never created the ``discussion_forums``,
``forum_memberships`` or ``forum_invites`` tables and therefore could not
``upgrade head`` against a fresh PostgreSQL/Neon database.

The schema below is the authoritative, complete mapping of the SQLAlchemy
models in ``app/models/`` for PostgreSQL (Neon). Alembic is the only schema
management system; there is no runtime ``create_all``.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.Text(), nullable=False),
        sa.Column("qualification", sa.String(100), nullable=False),
        sa.Column("interested_domains", sa.JSON(), nullable=True),
        sa.Column("country", sa.String(100), nullable=False),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("profile_slug", sa.String(100), nullable=False),
        sa.Column(
            "onboarding_completed",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column("onboarding_answers", sa.JSON(), nullable=True, server_default="{}"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_profile_slug"), "users", ["profile_slug"], unique=True)

    # ── discussion_forums ────────────────────────────────────────────────────
    op.create_table(
        "discussion_forums",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column("domain", sa.String(100), nullable=True),
        sa.Column("creator_id", sa.Integer(), nullable=False),
        sa.Column("join_token", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["creator_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_discussion_forums_id"), "discussion_forums", ["id"], unique=False)
    op.create_index(
        op.f("ix_discussion_forums_join_token"),
        "discussion_forums",
        ["join_token"],
        unique=True,
    )

    # ── forum_memberships ────────────────────────────────────────────────────
    op.create_table(
        "forum_memberships",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("forum_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(50), nullable=False, server_default="member"),
        sa.Column("joined_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["forum_id"], ["discussion_forums.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_forum_memberships_id"), "forum_memberships", ["id"], unique=False)
    op.create_index(
        op.f("ix_forum_memberships_forum_id"), "forum_memberships", ["forum_id"], unique=False
    )
    op.create_index(
        op.f("ix_forum_memberships_user_id"), "forum_memberships", ["user_id"], unique=False
    )

    # ── forum_invites ────────────────────────────────────────────────────────
    op.create_table(
        "forum_invites",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("sender_id", sa.Integer(), nullable=False),
        sa.Column("recipient_id", sa.Integer(), nullable=False),
        sa.Column("forum_id", sa.Integer(), nullable=False),
        sa.Column("context", sa.String(500), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["sender_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["recipient_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["forum_id"], ["discussion_forums.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_forum_invites_id"), "forum_invites", ["id"], unique=False)
    op.create_index(
        op.f("ix_forum_invites_recipient_id"), "forum_invites", ["recipient_id"], unique=False
    )

    # ── user_onboarding (composite PK: id == users.id, domain) ───────────────
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

    # ── forum_messages (self-referential reply_to_id) ────────────────────────
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

    # ── forum_read_states (composite PK) ─────────────────────────────────────
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

    # ── forum_attachments ────────────────────────────────────────────────────
    op.create_table(
        "forum_attachments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("forum_id", sa.Integer(), nullable=False),
        sa.Column("message_id", sa.Integer(), nullable=True),
        sa.Column("uploader_id", sa.Integer(), nullable=False),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("stored_path", sa.String(512), nullable=False),
        sa.Column("content_type", sa.String(120), nullable=False),
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

    # ── forum_reactions (unique per message/user/emoji) ──────────────────────
    op.create_table(
        "forum_reactions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("message_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("emoji", sa.String(32), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["message_id"], ["forum_messages.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("message_id", "user_id", "emoji", name="uq_reaction_msg_user_emoji"),
    )
    op.create_index(op.f("ix_forum_reactions_id"), "forum_reactions", ["id"], unique=False)
    op.create_index(op.f("ix_forum_reactions_message_id"), "forum_reactions", ["message_id"], unique=False)


def downgrade() -> None:
    op.drop_table("forum_reactions")
    op.drop_table("forum_attachments")
    op.drop_table("forum_read_states")
    op.drop_table("forum_messages")
    op.drop_table("user_onboarding")
    op.drop_table("forum_invites")
    op.drop_table("forum_memberships")
    op.drop_table("discussion_forums")
    op.drop_table("users")
