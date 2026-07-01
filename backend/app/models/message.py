from datetime import datetime
from sqlalchemy import (
    String,
    Text,
    DateTime,
    ForeignKey,
    Integer,
    Boolean,
    Index,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column
from ..database import Base


class ForumMessage(Base):
    """A single chat message inside a discussion forum."""

    __tablename__ = "forum_messages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    forum_id: Mapped[int] = mapped_column(
        ForeignKey("discussion_forums.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sender_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)  # raw markdown-lite text
    # Self-referential "reply to" pointer.  SET NULL so deleting the parent
    # doesn't cascade-delete replies — they just lose the quoted reference.
    reply_to_id: Mapped[int | None] = mapped_column(
        ForeignKey("forum_messages.id", ondelete="SET NULL"), nullable=True
    )
    is_edited: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Composite index for keyset pagination: "messages in forum X before id Y".
    __table_args__ = (
        Index("ix_forum_messages_forum_id_id", "forum_id", "id"),
    )


class ForumReadState(Base):
    """Tracks the last message a user has read in a forum (unread indicator)."""

    __tablename__ = "forum_read_states"

    forum_id: Mapped[int] = mapped_column(
        ForeignKey("discussion_forums.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    last_read_message_id: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class ForumAttachment(Base):
    """A file uploaded into a forum and (once sent) attached to a message.

    Uploaded files start orphaned (message_id is NULL); they're linked to a
    message when the sender posts. message_id uses SET NULL so deleting a
    message keeps the file row for the Shared Resources panel.
    """

    __tablename__ = "forum_attachments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    forum_id: Mapped[int] = mapped_column(
        ForeignKey("discussion_forums.id", ondelete="CASCADE"), nullable=False, index=True
    )
    message_id: Mapped[int | None] = mapped_column(
        ForeignKey("forum_messages.id", ondelete="SET NULL"), nullable=True, index=True
    )
    uploader_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    # Cloudinary identifiers — the bytes live in Cloudinary, never on disk.
    # public_id lets us manage/delete the object; secure_url is the HTTPS link
    # served directly to the client.
    cloudinary_public_id: Mapped[str] = mapped_column(String(255), nullable=False)
    secure_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    content_type: Mapped[str] = mapped_column(String(120), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class ForumReaction(Base):
    """An emoji reaction by one user on one message (toggle on/off)."""

    __tablename__ = "forum_reactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    message_id: Mapped[int] = mapped_column(
        ForeignKey("forum_messages.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    emoji: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("message_id", "user_id", "emoji", name="uq_reaction_msg_user_emoji"),
    )
