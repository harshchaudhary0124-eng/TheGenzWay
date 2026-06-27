from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime


# ── Message author (lightweight; avatar derived client-side from full_name) ──
class MessageAuthor(BaseModel):
    id: int
    full_name: str

    model_config = {"from_attributes": True}


# ── A short preview of the message being replied to ──────────────────────────
class ReplyPreview(BaseModel):
    id: int
    sender_id: int
    sender_name: str
    content: str  # already truncated server-side; "" if the parent was deleted
    is_deleted: bool = False


# ── An uploaded file attached to a message / shared in the forum ─────────────
class AttachmentInfo(BaseModel):
    id: int
    url: str  # absolute or /uploads-relative; client prefixes with API base
    filename: str
    content_type: str
    size_bytes: int


# ── Aggregated emoji reaction (client derives count + "did I react") ─────────
class ReactionGroup(BaseModel):
    emoji: str
    user_ids: List[int] = []


# ── Full message as returned over REST history + WS broadcast ────────────────
class MessageResponse(BaseModel):
    id: int
    forum_id: int
    sender_id: int
    sender_name: str
    content: str
    reply_to: Optional[ReplyPreview] = None
    attachments: List[AttachmentInfo] = []
    reactions: List[ReactionGroup] = []
    is_edited: bool = False
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime


# ── Forum members listed in the sidebar ──────────────────────────────────────
class ForumMember(BaseModel):
    id: int
    full_name: str
    role: str
    is_online: bool = False


# ── Forum detail payload for the chat page header + sidebar ──────────────────
class ForumDetailResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    domain: Optional[str]
    creator_id: int
    created_at: datetime
    member_count: int
    members: List[ForumMember]
    current_user_role: str
    last_read_message_id: int = 0


class MarkReadRequest(BaseModel):
    last_read_message_id: int


# ── WebSocket client → server events ─────────────────────────────────────────
class WSIncomingMessage(BaseModel):
    type: Literal["message"]
    client_id: str
    content: str
    reply_to_id: Optional[int] = None
    attachment_ids: List[int] = []


class WSIncomingEdit(BaseModel):
    type: Literal["edit"]
    id: int
    content: str


class WSIncomingDelete(BaseModel):
    type: Literal["delete"]
    id: int


class WSIncomingTyping(BaseModel):
    type: Literal["typing"]
    is_typing: bool = True


class WSIncomingRead(BaseModel):
    type: Literal["read"]
    last_read_message_id: int


class WSIncomingReact(BaseModel):
    type: Literal["react"]
    message_id: int
    emoji: str
