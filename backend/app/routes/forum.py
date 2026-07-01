import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.user import User
from ..models.forum import DiscussionForum, ForumMembership, ForumInvite
from ..schemas.forum import (
    CreateForumRequest,
    UpdateForumRequest,
    InviteLinkResponse,
    SendInviteRequest,
    ForumResponse,
    ForumInviteResponse,
    InviteSenderInfo,
    MatchedDomainInfo,
)
from ..routes.auth import get_current_user
from ..routes.discover import _identity_summary, _row_to_answers
from ..models.onboarding import UserOnboarding
from ..services.forum_access import require_membership

router = APIRouter(prefix="/forums", tags=["forums"])


@router.get("/mine", response_model=List[ForumResponse])
def get_my_forums(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    memberships = (
        db.query(ForumMembership)
        .filter(ForumMembership.user_id == current_user.id)
        .all()
    )
    forum_ids = [m.forum_id for m in memberships]
    if not forum_ids:
        return []
    forums = (
        db.query(DiscussionForum)
        .filter(DiscussionForum.id.in_(forum_ids))
        .order_by(DiscussionForum.created_at.desc())
        .all()
    )
    # Member counts for all of these forums in one grouped query (was N+1).
    count_map = dict(
        db.query(ForumMembership.forum_id, func.count(ForumMembership.id))
        .filter(ForumMembership.forum_id.in_(forum_ids))
        .group_by(ForumMembership.forum_id)
        .all()
    )
    result = []
    for forum in forums:
        member_count = count_map.get(forum.id, 0)
        result.append(
            ForumResponse(
                id=forum.id,
                name=forum.name,
                description=forum.description,
                domain=forum.domain,
                creator_id=forum.creator_id,
                created_at=forum.created_at,
                member_count=member_count,
            )
        )
    return result


@router.get("/invites", response_model=List[ForumInviteResponse])
def get_invites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invites = (
        db.query(ForumInvite)
        .filter(
            ForumInvite.recipient_id == current_user.id,
            ForumInvite.status == "pending",
        )
        .order_by(ForumInvite.created_at.desc())
        .all()
    )
    if not invites:
        return []

    # Batch-load all senders, forums, and sender onboarding rows up front so the
    # per-invite loop touches only in-memory dicts (was 3 queries per invite).
    sender_ids = {inv.sender_id for inv in invites}
    forum_ids = {inv.forum_id for inv in invites}
    senders_map = {u.id: u for u in db.query(User).filter(User.id.in_(sender_ids)).all()}
    forums_map = {
        f.id: f for f in db.query(DiscussionForum).filter(DiscussionForum.id.in_(forum_ids)).all()
    }
    onboarding_by_sender: dict[int, dict[str, UserOnboarding]] = {}
    for row in db.query(UserOnboarding).filter(UserOnboarding.id.in_(sender_ids)).all():
        onboarding_by_sender.setdefault(row.id, {})[row.domain] = row

    result = []
    for invite in invites:
        sender = senders_map.get(invite.sender_id)
        forum = forums_map.get(invite.forum_id)
        if not sender or not forum:
            continue
        sender_domains: list[str] = sender.interested_domains or []
        # Read each domain row individually so a single incomplete domain
        # doesn't blank out all the others.
        sender_row_map = onboarding_by_sender.get(sender.id, {})
        sender_json: dict = sender.onboarding_answers or {}
        sender_matched: list[MatchedDomainInfo] = []
        for domain in sender_domains:
            row = sender_row_map.get(domain)
            if row:
                answers: dict = _row_to_answers(row, domain)
            else:
                raw: dict = sender_json.get(domain, {})
                answers = {k: str(v) for k, v in raw.items()} if raw else {}
            sender_matched.append(MatchedDomainInfo(
                domain=domain,
                onboarding_answers=answers,
                identity_summary=_identity_summary(domain, answers),
                why_matched="",
            ))
        result.append(
            ForumInviteResponse(
                id=invite.id,
                sender=InviteSenderInfo(
                    id=sender.id,
                    full_name=sender.full_name,
                    city=sender.city,
                    country=sender.country,
                    interested_domains=sender_domains,
                    matched_domains=sender_matched,
                ),
                forum_id=invite.forum_id,
                forum_name=forum.name,
                forum_domain=forum.domain,
                context=invite.context,
                status=invite.status,
                created_at=invite.created_at,
            )
        )
    return result


@router.post("", response_model=ForumResponse, status_code=status.HTTP_201_CREATED)
def create_forum(
    body: CreateForumRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Forum name cannot be empty")
    forum = DiscussionForum(
        name=body.name.strip(),
        description=body.description,
        domain=body.domain,
        creator_id=current_user.id,
    )
    db.add(forum)
    db.flush()
    db.add(ForumMembership(forum_id=forum.id, user_id=current_user.id, role="creator"))
    db.commit()
    db.refresh(forum)
    return ForumResponse(
        id=forum.id,
        name=forum.name,
        description=forum.description,
        domain=forum.domain,
        creator_id=forum.creator_id,
        created_at=forum.created_at,
        member_count=1,
    )


@router.post("/invite", status_code=status.HTTP_201_CREATED)
def send_invite(
    body: SendInviteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    recipient = db.get(User, body.recipient_id)
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    if recipient.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot invite yourself")

    if body.forum_id is not None:
        forum = db.get(DiscussionForum, body.forum_id)
        if not forum:
            raise HTTPException(status_code=404, detail="Forum not found")
        membership = (
            db.query(ForumMembership)
            .filter(
                ForumMembership.forum_id == body.forum_id,
                ForumMembership.user_id == current_user.id,
            )
            .first()
        )
        if not membership:
            raise HTTPException(status_code=403, detail="You are not a member of this forum")
        forum_id = body.forum_id
    else:
        if not body.forum_name or not body.forum_name.strip():
            raise HTTPException(status_code=400, detail="forum_name is required for a new forum")
        forum = DiscussionForum(
            name=body.forum_name.strip(),
            description=body.forum_description,
            domain=body.forum_domain,
            creator_id=current_user.id,
        )
        db.add(forum)
        db.flush()
        db.add(ForumMembership(forum_id=forum.id, user_id=current_user.id, role="creator"))
        forum_id = forum.id

    existing = (
        db.query(ForumInvite)
        .filter(
            ForumInvite.sender_id == current_user.id,
            ForumInvite.recipient_id == body.recipient_id,
            ForumInvite.forum_id == forum_id,
            ForumInvite.status == "pending",
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Invite already pending for this forum")

    invite = ForumInvite(
        sender_id=current_user.id,
        recipient_id=body.recipient_id,
        forum_id=forum_id,
        context=body.context,
    )
    db.add(invite)
    db.commit()
    return {"message": "Invite sent"}


@router.put("/invites/{invite_id}/accept")
def accept_invite(
    invite_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invite = db.get(ForumInvite, invite_id)
    if not invite or invite.recipient_id != current_user.id:
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.status != "pending":
        raise HTTPException(status_code=400, detail="Invite is no longer pending")

    already_member = (
        db.query(ForumMembership)
        .filter(
            ForumMembership.forum_id == invite.forum_id,
            ForumMembership.user_id == current_user.id,
        )
        .first()
    )
    if not already_member:
        db.add(
            ForumMembership(
                forum_id=invite.forum_id,
                user_id=current_user.id,
                role="member",
            )
        )
    invite.status = "accepted"
    db.commit()
    return {"message": "Accepted"}


@router.put("/invites/{invite_id}/reject")
def reject_invite(
    invite_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invite = db.get(ForumInvite, invite_id)
    if not invite or invite.recipient_id != current_user.id:
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.status != "pending":
        raise HTTPException(status_code=400, detail="Invite is no longer pending")
    invite.status = "rejected"
    db.commit()
    return {"message": "Rejected"}


# ── forum settings / membership management ───────────────────────────────────
@router.post("/join/{token}")
def join_via_link(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Auto-add the current user to the forum a share link points at."""
    forum = (
        db.query(DiscussionForum)
        .filter(DiscussionForum.join_token == token)
        .first()
    )
    if not forum:
        raise HTTPException(status_code=404, detail="Invalid or expired invite link")

    already = (
        db.query(ForumMembership)
        .filter(
            ForumMembership.forum_id == forum.id,
            ForumMembership.user_id == current_user.id,
        )
        .first()
    )
    if not already:
        db.add(ForumMembership(forum_id=forum.id, user_id=current_user.id, role="member"))
        db.commit()
    return {"forum_id": forum.id}


@router.patch("/{forum_id}", response_model=ForumResponse)
def update_forum(
    forum_id: int,
    body: UpdateForumRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    forum = db.get(DiscussionForum, forum_id)
    if not forum:
        raise HTTPException(status_code=404, detail="Forum not found")
    if forum.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the creator can edit this forum")

    if body.name is not None:
        if not body.name.strip():
            raise HTTPException(status_code=400, detail="Forum name cannot be empty")
        forum.name = body.name.strip()
    if body.description is not None:
        forum.description = body.description.strip() or None

    db.commit()
    db.refresh(forum)
    member_count = (
        db.query(ForumMembership).filter(ForumMembership.forum_id == forum.id).count()
    )
    return ForumResponse(
        id=forum.id,
        name=forum.name,
        description=forum.description,
        domain=forum.domain,
        creator_id=forum.creator_id,
        created_at=forum.created_at,
        member_count=member_count,
    )


@router.post("/{forum_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
def leave_forum(
    forum_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    membership = require_membership(db, forum_id, current_user.id)
    if membership.role == "creator":
        raise HTTPException(
            status_code=400,
            detail="The creator cannot leave their own forum",
        )
    db.delete(membership)
    db.commit()


@router.post("/{forum_id}/invite-link", response_model=InviteLinkResponse)
def get_invite_link(
    forum_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lazily generate (or return the existing) shareable join link. Any member."""
    require_membership(db, forum_id, current_user.id)
    forum = db.get(DiscussionForum, forum_id)
    if forum.join_token is None:
        # Regenerate on the rare collision so the unique constraint never trips.
        for _ in range(5):
            candidate = secrets.token_urlsafe(16)
            exists = (
                db.query(DiscussionForum)
                .filter(DiscussionForum.join_token == candidate)
                .first()
            )
            if not exists:
                forum.join_token = candidate
                break
        db.commit()
        db.refresh(forum)
    return InviteLinkResponse(
        token=forum.join_token,
        url=f"/forums/join/{forum.join_token}",
    )
