"""WebSocket endpoint for real-time forum chat.

Browsers can't set Authorization headers on a WebSocket handshake, so the JWT
is passed as a `?token=` query param and decoded with decode_access_token.

DB work is sync SQLAlchemy; it's run in a threadpool so the event loop isn't
blocked, and each call uses its own short-lived session (sessions are not safe
to hold across awaits).
"""
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool

from ..database import SessionLocal
from ..models.user import User
from ..security import ws_connection_allowed
from ..services.auth import decode_access_token
from ..services.forum_access import require_membership
from ..services import chat
from ..services.ws_manager import manager, Connection

logger = logging.getLogger(__name__)

router = APIRouter(tags=["forum-chat-ws"])

WS_POLICY_VIOLATION = 1008
WS_TRY_AGAIN_LATER = 1013


# ── threadpool DB helpers (each opens + closes its own session) ──────────────
def _load_user_and_check(forum_id: int, user_id: int) -> str | None:
    """Returns the user's full_name if they exist and are a member, else None."""
    db = SessionLocal()
    try:
        user = db.get(User, user_id)
        if user is None:
            return None
        try:
            require_membership(db, forum_id, user_id)
        except Exception:
            return None
        return user.full_name
    finally:
        db.close()


def _create(forum_id, user_id, content, reply_to_id, attachment_ids):
    db = SessionLocal()
    try:
        return chat.create_message(
            db, forum_id, user_id, content, reply_to_id, attachment_ids
        )
    finally:
        db.close()


def _edit(message_id, user_id, content):
    db = SessionLocal()
    try:
        return chat.edit_message(db, message_id, user_id, content)
    finally:
        db.close()


def _delete(message_id, user_id):
    db = SessionLocal()
    try:
        return chat.delete_message(db, message_id, user_id)
    finally:
        db.close()


def _mark_read(forum_id, user_id, last_read_message_id):
    db = SessionLocal()
    try:
        chat.mark_read(db, forum_id, user_id, last_read_message_id)
    finally:
        db.close()


def _react(message_id, user_id, emoji):
    db = SessionLocal()
    try:
        return chat.toggle_reaction(db, message_id, user_id, emoji)
    finally:
        db.close()


async def _broadcast_presence(forum_id: int) -> None:
    await manager.broadcast(
        forum_id, {"type": "presence", "online": list(manager.online_user_ids(forum_id))}
    )


@router.websocket("/ws/forums/{forum_id}")
async def forum_chat(websocket: WebSocket, forum_id: int):
    # Throttle handshakes per client IP before doing any auth/DB work.
    client_ip = websocket.client.host if websocket.client else "unknown"
    if not ws_connection_allowed(client_ip):
        await websocket.close(code=WS_TRY_AGAIN_LATER)
        return

    token = websocket.query_params.get("token")
    user_id = decode_access_token(token) if token else None
    if not user_id:
        await websocket.close(code=WS_POLICY_VIOLATION)
        return

    full_name = await run_in_threadpool(_load_user_and_check, forum_id, user_id)
    if full_name is None:
        await websocket.close(code=WS_POLICY_VIOLATION)
        return

    conn: Connection = await manager.connect(forum_id, websocket, user_id)
    await _broadcast_presence(forum_id)

    try:
        while True:
            data = await websocket.receive_json()
            kind = data.get("type")

            if kind == "message":
                try:
                    msg = await run_in_threadpool(
                        _create,
                        forum_id,
                        user_id,
                        data.get("content", ""),
                        data.get("reply_to_id"),
                        data.get("attachment_ids") or [],
                    )
                except chat.ChatError as exc:
                    await manager.send_to(
                        conn,
                        {"type": "error", "client_id": data.get("client_id"), "detail": exc.message},
                    )
                    continue
                await manager.broadcast(
                    forum_id,
                    {
                        "type": "message",
                        "client_id": data.get("client_id"),
                        "message": msg.model_dump(mode="json"),
                    },
                )

            elif kind == "edit":
                try:
                    msg = await run_in_threadpool(_edit, data.get("id"), user_id, data.get("content", ""))
                except chat.ChatError as exc:
                    await manager.send_to(conn, {"type": "error", "detail": exc.message})
                    continue
                await manager.broadcast(
                    forum_id, {"type": "edit", "message": msg.model_dump(mode="json")}
                )

            elif kind == "delete":
                try:
                    msg = await run_in_threadpool(_delete, data.get("id"), user_id)
                except chat.ChatError as exc:
                    await manager.send_to(conn, {"type": "error", "detail": exc.message})
                    continue
                await manager.broadcast(
                    forum_id, {"type": "delete", "message": msg.model_dump(mode="json")}
                )

            elif kind == "typing":
                await manager.broadcast(
                    forum_id,
                    {
                        "type": "typing",
                        "user_id": user_id,
                        "full_name": full_name,
                        "is_typing": bool(data.get("is_typing", True)),
                    },
                    exclude=conn,
                )

            elif kind == "read":
                last_id = data.get("last_read_message_id")
                if isinstance(last_id, int):
                    await run_in_threadpool(_mark_read, forum_id, user_id, last_id)

            elif kind == "react":
                msg_id = data.get("message_id")
                emoji = data.get("emoji", "")
                if not isinstance(msg_id, int):
                    continue
                try:
                    msg = await run_in_threadpool(_react, msg_id, user_id, emoji)
                except chat.ChatError as exc:
                    await manager.send_to(conn, {"type": "error", "detail": exc.message})
                    continue
                await manager.broadcast(
                    forum_id, {"type": "reaction", "message": msg.model_dump(mode="json")}
                )

    except WebSocketDisconnect:
        pass
    except Exception:
        # Unexpected WS error — log it (no message payloads / tokens) so the
        # failure is observable; the connection is still cleaned up below.
        logger.exception("WebSocket error on forum %s", forum_id)
    finally:
        manager.disconnect(conn)
        await _broadcast_presence(forum_id)
