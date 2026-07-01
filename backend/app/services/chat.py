"""Chat persistence + serialization logic.

Used by both the REST history endpoints (routes/messages.py) and the
WebSocket write path (routes/ws.py) so the two stay consistent.
"""
from typing import Optional, Iterable
from sqlalchemy.orm import Session

from ..models.user import User
from ..models.forum import DiscussionForum, ForumMembership
from ..models.message import (
    ForumMessage,
    ForumReadState,
    ForumAttachment,
    ForumReaction,
)
from ..schemas.message import (
    MessageResponse,
    ReplyPreview,
    ForumMember,
    ForumDetailResponse,
    AttachmentInfo,
    ReactionGroup,
)

REPLY_PREVIEW_LEN = 120


# ── attachment / reaction helpers ────────────────────────────────────────────
def _attachment_info(att: ForumAttachment) -> AttachmentInfo:
    return AttachmentInfo(
        id=att.id,
        url=att.secure_url,  # absolute https Cloudinary link, served directly
        filename=att.filename,
        content_type=att.content_type,
        size_bytes=att.size_bytes,
    )


def _attachments_for(db: Session, message_ids: Iterable[int]) -> dict[int, list[AttachmentInfo]]:
    ids = [mid for mid in message_ids if mid is not None]
    if not ids:
        return {}
    out: dict[int, list[AttachmentInfo]] = {}
    rows = (
        db.query(ForumAttachment)
        .filter(ForumAttachment.message_id.in_(ids))
        .order_by(ForumAttachment.id.asc())
        .all()
    )
    for att in rows:
        out.setdefault(att.message_id, []).append(_attachment_info(att))
    return out


def _reactions_for(db: Session, message_ids: Iterable[int]) -> dict[int, list[ReactionGroup]]:
    ids = [mid for mid in message_ids if mid is not None]
    if not ids:
        return {}
    grouped: dict[int, dict[str, list[int]]] = {}
    rows = (
        db.query(ForumReaction)
        .filter(ForumReaction.message_id.in_(ids))
        .order_by(ForumReaction.id.asc())
        .all()
    )
    for r in rows:
        grouped.setdefault(r.message_id, {}).setdefault(r.emoji, []).append(r.user_id)
    return {
        mid: [ReactionGroup(emoji=emoji, user_ids=uids) for emoji, uids in emojis.items()]
        for mid, emojis in grouped.items()
    }


class ChatError(Exception):
    """Domain error (not found / forbidden) surfaced to the WS client."""

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


# ── name resolution helpers ──────────────────────────────────────────────────
def _names_for(db: Session, user_ids: Iterable[int]) -> dict[int, str]:
    ids = {uid for uid in user_ids if uid is not None}
    if not ids:
        return {}
    rows = db.query(User.id, User.full_name).filter(User.id.in_(ids)).all()
    return {uid: name for uid, name in rows}


def _serialize(
    msg: ForumMessage,
    name_map: dict[int, str],
    reply_map: dict[int, ForumMessage],
    attachment_map: Optional[dict[int, list[AttachmentInfo]]] = None,
    reaction_map: Optional[dict[int, list[ReactionGroup]]] = None,
) -> MessageResponse:
    reply: Optional[ReplyPreview] = None
    if msg.reply_to_id is not None:
        parent = reply_map.get(msg.reply_to_id)
        if parent is not None:
            reply = ReplyPreview(
                id=parent.id,
                sender_id=parent.sender_id,
                sender_name=name_map.get(parent.sender_id, "Unknown"),
                content=(
                    "" if parent.is_deleted
                    else _truncate(parent.content, REPLY_PREVIEW_LEN)
                ),
                is_deleted=parent.is_deleted,
            )
    # A deleted message hides its content + attachments but keeps reactions off too.
    attachments = [] if msg.is_deleted else (attachment_map or {}).get(msg.id, [])
    reactions = (reaction_map or {}).get(msg.id, [])
    return MessageResponse(
        id=msg.id,
        forum_id=msg.forum_id,
        sender_id=msg.sender_id,
        sender_name=name_map.get(msg.sender_id, "Unknown"),
        content="" if msg.is_deleted else msg.content,
        reply_to=reply,
        attachments=attachments,
        reactions=reactions,
        is_edited=msg.is_edited,
        is_deleted=msg.is_deleted,
        created_at=msg.created_at,
        updated_at=msg.updated_at,
    )


def _truncate(text: str, limit: int) -> str:
    text = text.strip()
    return text if len(text) <= limit else text[: limit - 1] + "…"


def _serialize_one(db: Session, msg: ForumMessage) -> MessageResponse:
    """Serialize a single message, resolving sender + reply-parent names."""
    reply_map: dict[int, ForumMessage] = {}
    sender_ids = {msg.sender_id}
    if msg.reply_to_id is not None:
        parent = db.get(ForumMessage, msg.reply_to_id)
        if parent is not None:
            reply_map[parent.id] = parent
            sender_ids.add(parent.sender_id)
    name_map = _names_for(db, sender_ids)
    attachment_map = _attachments_for(db, [msg.id])
    reaction_map = _reactions_for(db, [msg.id])
    return _serialize(msg, name_map, reply_map, attachment_map, reaction_map)


# ── reads ─────────────────────────────────────────────────────────────────────
def list_messages(
    db: Session,
    forum_id: int,
    before: Optional[int],
    limit: int,
) -> list[MessageResponse]:
    """
    Keyset-paginated history. Returns up to `limit` messages ending just before
    `before` (exclusive), in ascending chronological order (oldest → newest).
    """
    limit = max(1, min(limit, 100))
    q = db.query(ForumMessage).filter(ForumMessage.forum_id == forum_id)
    if before is not None:
        q = q.filter(ForumMessage.id < before)
    rows = q.order_by(ForumMessage.id.desc()).limit(limit).all()
    rows.reverse()  # ascending for rendering

    # Batch-resolve reply parents + sender names to avoid N+1.
    reply_ids = {m.reply_to_id for m in rows if m.reply_to_id is not None}
    reply_map: dict[int, ForumMessage] = {}
    if reply_ids:
        for parent in db.query(ForumMessage).filter(ForumMessage.id.in_(reply_ids)).all():
            reply_map[parent.id] = parent
    sender_ids = {m.sender_id for m in rows} | {p.sender_id for p in reply_map.values()}
    name_map = _names_for(db, sender_ids)
    msg_ids = [m.id for m in rows]
    attachment_map = _attachments_for(db, msg_ids)
    reaction_map = _reactions_for(db, msg_ids)
    return [_serialize(m, name_map, reply_map, attachment_map, reaction_map) for m in rows]


def get_forum_detail(
    db: Session,
    forum_id: int,
    current_user_id: int,
    online_ids: set[int],
) -> ForumDetailResponse:
    forum = db.get(DiscussionForum, forum_id)
    if forum is None:
        raise ChatError("Forum not found")

    memberships = (
        db.query(ForumMembership)
        .filter(ForumMembership.forum_id == forum_id)
        .all()
    )
    name_map = _names_for(db, [m.user_id for m in memberships])
    members: list[ForumMember] = []
    current_role = "member"
    for m in memberships:
        if m.user_id == current_user_id:
            current_role = m.role
        members.append(
            ForumMember(
                id=m.user_id,
                full_name=name_map.get(m.user_id, "Unknown"),
                role=m.role,
                is_online=m.user_id in online_ids,
            )
        )
    # creator first, then online, then by name
    members.sort(key=lambda x: (x.role != "creator", not x.is_online, x.full_name.lower()))

    read_state = (
        db.query(ForumReadState)
        .filter(
            ForumReadState.forum_id == forum_id,
            ForumReadState.user_id == current_user_id,
        )
        .first()
    )

    return ForumDetailResponse(
        id=forum.id,
        name=forum.name,
        description=forum.description,
        domain=forum.domain,
        creator_id=forum.creator_id,
        created_at=forum.created_at,
        member_count=len(memberships),
        members=members,
        current_user_role=current_role,
        last_read_message_id=read_state.last_read_message_id if read_state else 0,
    )


# ── writes ────────────────────────────────────────────────────────────────────
def create_message(
    db: Session,
    forum_id: int,
    sender_id: int,
    content: str,
    reply_to_id: Optional[int],
    attachment_ids: Optional[list[int]] = None,
) -> MessageResponse:
    content = (content or "").strip()
    attachment_ids = attachment_ids or []

    # Resolve the sender's own, still-orphaned attachments for this forum.
    attachments: list[ForumAttachment] = []
    if attachment_ids:
        attachments = (
            db.query(ForumAttachment)
            .filter(
                ForumAttachment.id.in_(attachment_ids),
                ForumAttachment.forum_id == forum_id,
                ForumAttachment.uploader_id == sender_id,
                ForumAttachment.message_id.is_(None),
            )
            .all()
        )

    if not content and not attachments:
        raise ChatError("Message cannot be empty")
    if len(content) > 4000:
        raise ChatError("Message is too long")

    if reply_to_id is not None:
        parent = db.get(ForumMessage, reply_to_id)
        if parent is None or parent.forum_id != forum_id:
            reply_to_id = None  # silently drop invalid reply reference

    msg = ForumMessage(
        forum_id=forum_id,
        sender_id=sender_id,
        content=content,
        reply_to_id=reply_to_id,
    )
    db.add(msg)
    db.flush()  # assign msg.id before linking attachments
    for att in attachments:
        att.message_id = msg.id
    db.commit()
    db.refresh(msg)
    return _serialize_one(db, msg)


def edit_message(db: Session, message_id: int, user_id: int, content: str) -> MessageResponse:
    content = (content or "").strip()
    if not content:
        raise ChatError("Message cannot be empty")
    msg = db.get(ForumMessage, message_id)
    if msg is None or msg.is_deleted:
        raise ChatError("Message not found")
    if msg.sender_id != user_id:
        raise ChatError("You can only edit your own messages")
    msg.content = content
    msg.is_edited = True
    db.commit()
    db.refresh(msg)
    return _serialize_one(db, msg)


def delete_message(db: Session, message_id: int, user_id: int) -> MessageResponse:
    msg = db.get(ForumMessage, message_id)
    if msg is None:
        raise ChatError("Message not found")
    if msg.sender_id != user_id:
        raise ChatError("You can only delete your own messages")
    msg.is_deleted = True
    msg.content = ""
    db.commit()
    db.refresh(msg)
    return _serialize_one(db, msg)


def mark_read(db: Session, forum_id: int, user_id: int, last_read_message_id: int) -> None:
    state = (
        db.query(ForumReadState)
        .filter(
            ForumReadState.forum_id == forum_id,
            ForumReadState.user_id == user_id,
        )
        .first()
    )
    if state is None:
        state = ForumReadState(
            forum_id=forum_id,
            user_id=user_id,
            last_read_message_id=last_read_message_id,
        )
        db.add(state)
    elif last_read_message_id > state.last_read_message_id:
        state.last_read_message_id = last_read_message_id
    db.commit()


# ── reactions ───────────────────────────────────────────────────────────────
def toggle_reaction(
    db: Session, message_id: int, user_id: int, emoji: str
) -> MessageResponse:
    emoji = (emoji or "").strip()
    if not emoji or len(emoji) > 32:
        raise ChatError("Invalid reaction")
    msg = db.get(ForumMessage, message_id)
    if msg is None or msg.is_deleted:
        raise ChatError("Message not found")

    existing = (
        db.query(ForumReaction)
        .filter(
            ForumReaction.message_id == message_id,
            ForumReaction.user_id == user_id,
            ForumReaction.emoji == emoji,
        )
        .first()
    )
    if existing is not None:
        db.delete(existing)
    else:
        db.add(ForumReaction(message_id=message_id, user_id=user_id, emoji=emoji))
    db.commit()
    db.refresh(msg)
    return _serialize_one(db, msg)


# ── attachments ─────────────────────────────────────────────────────────────
def save_attachment(
    db: Session,
    forum_id: int,
    uploader_id: int,
    filename: str,
    cloudinary_public_id: str,
    secure_url: str,
    content_type: str,
    size_bytes: int,
) -> AttachmentInfo:
    att = ForumAttachment(
        forum_id=forum_id,
        uploader_id=uploader_id,
        filename=filename,
        cloudinary_public_id=cloudinary_public_id,
        secure_url=secure_url,
        content_type=content_type,
        size_bytes=size_bytes,
    )
    db.add(att)
    db.commit()
    db.refresh(att)
    return _attachment_info(att)


def list_attachments(db: Session, forum_id: int) -> list[AttachmentInfo]:
    """All sent attachments in a forum (newest first) for the Shared Resources panel."""
    rows = (
        db.query(ForumAttachment)
        .filter(
            ForumAttachment.forum_id == forum_id,
            ForumAttachment.message_id.isnot(None),
        )
        .order_by(ForumAttachment.id.desc())
        .all()
    )
    return [_attachment_info(att) for att in rows]


# ── search ──────────────────────────────────────────────────────────────────
def search_messages(
    db: Session, forum_id: int, query: str, limit: int
) -> list[MessageResponse]:
    query = (query or "").strip()
    if not query:
        return []
    limit = max(1, min(limit, 50))
    rows = (
        db.query(ForumMessage)
        .filter(
            ForumMessage.forum_id == forum_id,
            ForumMessage.is_deleted.is_(False),
            ForumMessage.content.ilike(f"%{query}%"),
        )
        .order_by(ForumMessage.id.desc())
        .limit(limit)
        .all()
    )
    reply_ids = {m.reply_to_id for m in rows if m.reply_to_id is not None}
    reply_map: dict[int, ForumMessage] = {}
    if reply_ids:
        for parent in db.query(ForumMessage).filter(ForumMessage.id.in_(reply_ids)).all():
            reply_map[parent.id] = parent
    sender_ids = {m.sender_id for m in rows} | {p.sender_id for p in reply_map.values()}
    name_map = _names_for(db, sender_ids)
    msg_ids = [m.id for m in rows]
    attachment_map = _attachments_for(db, msg_ids)
    reaction_map = _reactions_for(db, msg_ids)
    return [_serialize(m, name_map, reply_map, attachment_map, reaction_map) for m in rows]
