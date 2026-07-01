"""End-to-end functional suite (PostgreSQL / Neon).

Exercises every backend feature through the real HTTP/WebSocket API:
health, auth, JWT, onboarding, discover, forums, invites, memberships, join
links, real-time chat (send/edit/delete/react/typing/read/presence), message
history, search, mark-read, and attachment upload/listing.
"""
import io
import uuid

from conftest import auth_header, complete_onboarding


# ── health ───────────────────────────────────────────────────────────────────
def test_health(client):
    r = client.get("/")
    assert r.status_code == 200 and r.json() == {"status": "ok"}


# ── auth / registration ──────────────────────────────────────────────────────
def test_register_login_me(client, make_user):
    token, me = make_user(full_name="Alice Builder")
    assert me["full_name"] == "Alice Builder"
    assert me["onboarding_completed"] is False
    assert me["profile_slug"]

    # login with the same credentials
    r = client.post("/auth/login", json={"email": me["email"], "password": "supersecret123"})
    assert r.status_code == 200 and r.json()["access_token"]


def test_register_duplicate_email_rejected(client):
    email = f"dup_{uuid.uuid4().hex[:8]}@example.com"
    body = {"full_name": "Dup User", "email": email, "password": "supersecret123",
            "qualification": "Student", "interested_domains": ["Design"],
            "country": "India", "city": "Pune"}
    assert client.post("/auth/register", json=body).status_code == 201
    assert client.post("/auth/register", json=body).status_code == 409


def test_register_validation(client):
    base = {"full_name": "Shorty", "email": f"v_{uuid.uuid4().hex[:8]}@example.com",
            "qualification": "Student", "interested_domains": ["Design"],
            "country": "India", "city": "Pune"}
    # password too short -> 422
    assert client.post("/auth/register", json={**base, "password": "short"}).status_code == 422
    # no domains -> 422
    assert client.post("/auth/register",
                       json={**base, "password": "supersecret123", "interested_domains": []}
                       ).status_code == 422


def test_login_wrong_password(client, make_user):
    _, me = make_user()
    r = client.post("/auth/login", json={"email": me["email"], "password": "wrongpassword"})
    assert r.status_code == 401


def test_me_requires_auth(client):
    assert client.get("/auth/me").status_code in (401, 403)
    assert client.get("/auth/me", headers=auth_header("garbage.token")).status_code == 401


# ── onboarding ───────────────────────────────────────────────────────────────
def test_onboarding_flow(client, make_user):
    domains = ["Artificial Intelligence", "Design"]
    token, _ = make_user(domains=domains)
    me = complete_onboarding(client, token, domains)
    assert me["onboarding_completed"] is True
    assert set(me["onboarding_answers"].keys()) == set(domains)

    prof = client.get("/auth/onboarding-profile", headers=auth_header(token))
    assert prof.status_code == 200
    assert prof.json()["answer_1"] == "A1"


def test_onboarding_incomplete_rejected(client, make_user):
    token, _ = make_user(domains=["Artificial Intelligence", "Design"])
    # only one domain submitted -> 400
    r = client.post("/auth/onboarding", headers=auth_header(token), json={
        "domains_data": [{"domain": "Artificial Intelligence",
                          "answers": {"q1": "a", "q2": "b", "q3": "c", "q4": "d"}}]})
    assert r.status_code == 400


def test_sync_onboarding_endpoint(client, make_user):
    token, _ = make_user(domains=["Artificial Intelligence"])
    complete_onboarding(client, token, ["Artificial Intelligence"])
    r = client.post("/auth/sync-onboarding", headers=auth_header(token))
    assert r.status_code == 200 and "synced_rows" in r.json()


# ── discover ─────────────────────────────────────────────────────────────────
def test_discover_people(client, make_user):
    domain = "Artificial Intelligence"
    t1, u1 = make_user(domains=[domain], full_name="Disco One")
    t2, u2 = make_user(domains=[domain], full_name="Disco Two")
    complete_onboarding(client, t1, [domain])
    complete_onboarding(client, t2, [domain])

    r = client.get("/discover/people", headers=auth_header(t1))
    assert r.status_code == 200
    found = [p for p in r.json() if p["id"] == u2["id"]]
    assert found, "completed same-domain user should appear in discover"
    assert found[0]["matched_domains"][0]["domain"] == domain


# ── forums + invites + membership ────────────────────────────────────────────
def test_forum_create_and_mine(client, make_user):
    token, _ = make_user()
    r = client.post("/forums", headers=auth_header(token),
                    json={"name": "AI Builders", "description": "d", "domain": "Artificial Intelligence"})
    assert r.status_code == 201, r.text
    fid = r.json()["id"]
    assert r.json()["member_count"] == 1

    mine = client.get("/forums/mine", headers=auth_header(token))
    assert mine.status_code == 200
    assert any(f["id"] == fid for f in mine.json())


def test_invite_accept_membership(client, make_user):
    ta, ua = make_user(full_name="Inviter")
    tb, ub = make_user(full_name="Invitee")
    fid = client.post("/forums", headers=auth_header(ta),
                      json={"name": "Invite Forum"}).json()["id"]

    # send invite (note: accept/reject are PUT)
    inv = client.post("/forums/invite", headers=auth_header(ta),
                      json={"recipient_id": ub["id"], "forum_id": fid, "context": "join"})
    assert inv.status_code == 201, inv.text

    invites = client.get("/forums/invites", headers=auth_header(tb))
    assert invites.status_code == 200 and len(invites.json()) >= 1
    invite_id = invites.json()[0]["id"]

    acc = client.put(f"/forums/invites/{invite_id}/accept", headers=auth_header(tb))
    assert acc.status_code == 200, acc.text

    detail = client.get(f"/forums/{fid}", headers=auth_header(tb))
    assert detail.status_code == 200
    assert detail.json()["member_count"] == 2
    assert {m["id"] for m in detail.json()["members"]} == {ua["id"], ub["id"]}


def test_invite_reject(client, make_user):
    ta, _ = make_user()
    tb, ub = make_user()
    fid = client.post("/forums", headers=auth_header(ta), json={"name": "Reject Forum"}).json()["id"]
    client.post("/forums/invite", headers=auth_header(ta), json={"recipient_id": ub["id"], "forum_id": fid})
    invite_id = client.get("/forums/invites", headers=auth_header(tb)).json()[0]["id"]
    r = client.put(f"/forums/invites/{invite_id}/reject", headers=auth_header(tb))
    assert r.status_code == 200
    assert client.get("/forums/invites", headers=auth_header(tb)).json() == []


def test_invite_link_and_join(client, make_user):
    ta, _ = make_user()
    tb, ub = make_user()
    fid = client.post("/forums", headers=auth_header(ta), json={"name": "Link Forum"}).json()["id"]

    link = client.post(f"/forums/{fid}/invite-link", headers=auth_header(ta))
    assert link.status_code == 200
    token_str = link.json()["token"]

    joined = client.post(f"/forums/join/{token_str}", headers=auth_header(tb))
    assert joined.status_code == 200 and joined.json()["forum_id"] == fid

    detail = client.get(f"/forums/{fid}", headers=auth_header(tb))
    assert detail.json()["member_count"] == 2


def test_non_member_forbidden(client, make_user):
    ta, _ = make_user()
    tb, _ = make_user()
    fid = client.post("/forums", headers=auth_header(ta), json={"name": "Private"}).json()["id"]
    # tb is not a member -> 403
    assert client.get(f"/forums/{fid}", headers=auth_header(tb)).status_code == 403


# ── real-time chat over WebSocket ────────────────────────────────────────────
def _two_members(client, make_user):
    ta, ua = make_user(full_name="Chat A")
    tb, ub = make_user(full_name="Chat B")
    fid = client.post("/forums", headers=auth_header(ta), json={"name": "Chat Forum"}).json()["id"]
    invite_id = None
    client.post("/forums/invite", headers=auth_header(ta), json={"recipient_id": ub["id"], "forum_id": fid})
    invite_id = client.get("/forums/invites", headers=auth_header(tb)).json()[0]["id"]
    client.put(f"/forums/invites/{invite_id}/accept", headers=auth_header(tb))
    return (ta, ua), (tb, ub), fid


def test_ws_send_edit_delete_react(client, make_user):
    (ta, ua), (tb, ub), fid = _two_members(client, make_user)

    with client.websocket_connect(f"/ws/forums/{fid}?token={ta}") as wa, \
         client.websocket_connect(f"/ws/forums/{fid}?token={tb}") as wb:
        # both connections receive presence frames on connect
        wa.receive_json(); wa.receive_json()  # own presence + B's presence
        # drain B's initial presence frames
        wb.receive_json()

        # A sends a message
        wa.send_json({"type": "message", "client_id": "c1", "content": "hello world"})
        frame_a = _recv_until(wa, "message")
        frame_b = _recv_until(wb, "message")
        assert frame_a["message"]["content"] == "hello world"
        assert frame_b["message"]["sender_id"] == ua["id"]
        msg_id = frame_a["message"]["id"]

        # A edits it
        wa.send_json({"type": "edit", "id": msg_id, "content": "edited text"})
        edit_frame = _recv_until(wb, "edit")
        assert edit_frame["message"]["content"] == "edited text"
        assert edit_frame["message"]["is_edited"] is True

        # B reacts to it
        wb.send_json({"type": "react", "message_id": msg_id, "emoji": "\U0001F525"})
        react_frame = _recv_until(wa, "reaction")
        groups = react_frame["message"]["reactions"]
        assert any(g["emoji"] == "\U0001F525" and ub["id"] in g["user_ids"] for g in groups)

        # A deletes it
        wa.send_json({"type": "delete", "id": msg_id})
        del_frame = _recv_until(wb, "delete")
        assert del_frame["message"]["is_deleted"] is True
        assert del_frame["message"]["content"] == ""

    # history endpoint reflects the deleted (tombstoned) message
    hist = client.get(f"/forums/{fid}/messages", headers=auth_header(tb))
    assert hist.status_code == 200
    assert any(m["id"] == msg_id and m["is_deleted"] for m in hist.json())


def test_ws_rejects_bad_token(client, make_user):
    (ta, _), _, fid = _two_members(client, make_user)
    import starlette.websockets
    try:
        with client.websocket_connect(f"/ws/forums/{fid}?token=not-a-real-token") as ws:
            ws.receive_json()
        assert False, "bad token should be rejected"
    except starlette.websockets.WebSocketDisconnect:
        pass


# ── message history / search / read / attachments ────────────────────────────
def test_history_search_read_attachments(client, make_user, monkeypatch):
    (ta, ua), (tb, ub), fid = _two_members(client, make_user)

    # Attachments upload to Cloudinary in production. Tests must not hit the
    # network, so stub the media service to return a deterministic UploadResult.
    import app.services.media as media

    def _fake_upload(data, *, folder, filename, content_type):
        assert folder in media.ALL_FOLDERS
        return media.UploadResult(
            public_id=f"{folder}/test-{uuid.uuid4().hex}",
            secure_url="https://res.cloudinary.com/demo/image/upload/test.png",
            bytes=len(data),
            content_type=content_type,
            resource_type="image",
        )

    monkeypatch.setattr(media, "upload_file", _fake_upload)

    with client.websocket_connect(f"/ws/forums/{fid}?token={ta}") as wa:
        wa.receive_json()  # presence
        for text in ["alpha message", "beta message", "gamma alpha"]:
            wa.send_json({"type": "message", "client_id": text, "content": text})
            _recv_until(wa, "message")

    # history (ascending)
    hist = client.get(f"/forums/{fid}/messages?limit=50", headers=auth_header(tb)).json()
    contents = [m["content"] for m in hist]
    assert contents == ["alpha message", "beta message", "gamma alpha"]

    # search
    found = client.get(f"/forums/{fid}/messages/search?q=alpha", headers=auth_header(tb)).json()
    assert {m["content"] for m in found} == {"alpha message", "gamma alpha"}

    # mark read
    last_id = hist[-1]["id"]
    r = client.post(f"/forums/{fid}/read", headers=auth_header(tb),
                    json={"last_read_message_id": last_id})
    assert r.status_code == 204
    detail = client.get(f"/forums/{fid}", headers=auth_header(tb)).json()
    assert detail["last_read_message_id"] == last_id

    # attachment upload + list
    up = client.post(
        f"/forums/{fid}/attachments",
        headers=auth_header(ta),
        files={"file": ("note.png", io.BytesIO(b"\x89PNG\r\n\x1a\nfakepng"), "image/png")},
    )
    assert up.status_code == 200, up.text
    att_id = up.json()["id"]
    assert up.json()["filename"] == "note.png"

    # send a message that links the attachment, then it shows in the shared list
    with client.websocket_connect(f"/ws/forums/{fid}?token={ta}") as wa:
        wa.receive_json()
        wa.send_json({"type": "message", "client_id": "withfile", "content": "see file",
                      "attachment_ids": [att_id]})
        frame = _recv_until(wa, "message")
        assert frame["message"]["attachments"][0]["id"] == att_id

    listed = client.get(f"/forums/{fid}/attachments", headers=auth_header(tb)).json()
    assert any(a["id"] == att_id for a in listed)


# ── helpers ──────────────────────────────────────────────────────────────────
def _recv_until(ws, kind, limit=10):
    """Receive frames until one of `kind` arrives (skip presence/typing noise)."""
    for _ in range(limit):
        frame = ws.receive_json()
        if frame.get("type") == kind:
            return frame
    raise AssertionError(f"did not receive a '{kind}' frame")
