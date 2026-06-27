from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class CreateForumRequest(BaseModel):
    name: str
    description: Optional[str] = None
    domain: Optional[str] = None


class UpdateForumRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class InviteLinkResponse(BaseModel):
    token: str
    url: str


class SendInviteRequest(BaseModel):
    recipient_id: int
    forum_id: Optional[int] = None
    forum_name: Optional[str] = None
    forum_description: Optional[str] = None
    forum_domain: Optional[str] = None
    context: Optional[str] = None


class ForumResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    domain: Optional[str]
    creator_id: int
    created_at: datetime
    member_count: int = 0

    model_config = {"from_attributes": True}


class MatchedDomainInfo(BaseModel):
    domain: str
    onboarding_answers: Dict[str, Any] = {}
    identity_summary: str = ""
    why_matched: str = ""


class InviteSenderInfo(BaseModel):
    id: int
    full_name: str
    city: str
    country: str
    interested_domains: List[str]
    matched_domains: List[MatchedDomainInfo] = []

    model_config = {"from_attributes": True}


class ForumInviteResponse(BaseModel):
    id: int
    sender: InviteSenderInfo
    forum_id: int
    forum_name: str
    forum_domain: Optional[str]
    context: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
