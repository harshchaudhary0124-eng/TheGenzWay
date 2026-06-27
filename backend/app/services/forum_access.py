from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models.forum import DiscussionForum, ForumMembership


def require_membership(db: Session, forum_id: int, user_id: int) -> ForumMembership:
    """
    Ensure `user_id` is a member of `forum_id`.

    Returns the membership row (so callers can read the role).
    Raises 404 if the forum doesn't exist, 403 if the user isn't a member.
    Mirrors the inline membership check used in routes/forum.py.
    """
    forum = db.get(DiscussionForum, forum_id)
    if not forum:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Forum not found")

    membership = (
        db.query(ForumMembership)
        .filter(
            ForumMembership.forum_id == forum_id,
            ForumMembership.user_id == user_id,
        )
        .first()
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this forum",
        )
    return membership
