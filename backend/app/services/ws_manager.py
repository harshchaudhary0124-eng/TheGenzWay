"""In-process WebSocket connection manager for forum chat.

NOTE: state lives in this single process only. Running multiple Uvicorn
workers would split rooms across processes — a production multi-worker setup
needs a shared pub/sub backend (e.g. Redis). Out of scope for v1.
"""
from dataclasses import dataclass
from fastapi import WebSocket


@dataclass(eq=False)
class Connection:
    websocket: WebSocket
    user_id: int
    forum_id: int


class ConnectionManager:
    def __init__(self) -> None:
        # forum_id -> set of live connections
        self._rooms: dict[int, set[Connection]] = {}

    async def connect(self, forum_id: int, websocket: WebSocket, user_id: int) -> Connection:
        await websocket.accept()
        conn = Connection(websocket=websocket, user_id=user_id, forum_id=forum_id)
        self._rooms.setdefault(forum_id, set()).add(conn)
        return conn

    def disconnect(self, conn: Connection) -> None:
        room = self._rooms.get(conn.forum_id)
        if not room:
            return
        room.discard(conn)
        if not room:
            self._rooms.pop(conn.forum_id, None)

    def online_user_ids(self, forum_id: int) -> set[int]:
        return {c.user_id for c in self._rooms.get(forum_id, set())}

    async def broadcast(
        self, forum_id: int, payload: dict, exclude: Connection | None = None
    ) -> None:
        room = list(self._rooms.get(forum_id, set()))
        for conn in room:
            if conn is exclude:
                continue
            try:
                await conn.websocket.send_json(payload)
            except Exception:
                # Socket already gone; drop it so we don't keep retrying.
                self.disconnect(conn)

    async def send_to(self, conn: Connection, payload: dict) -> None:
        try:
            await conn.websocket.send_json(payload)
        except Exception:
            self.disconnect(conn)


# Single shared instance imported by the WS route.
manager = ConnectionManager()
