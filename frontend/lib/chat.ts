const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

function authHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

/** Derive the WebSocket origin from the HTTP API base. */
export function wsUrl(forumId: number, token: string): string {
  const base = API.replace(/^http/, "ws");
  return `${base}/ws/forums/${forumId}?token=${encodeURIComponent(token)}`;
}

// ── Types (mirror backend schemas/message.py) ────────────────────────────────
export type ReplyPreview = {
  id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  is_deleted: boolean;
};

export type AttachmentInfo = {
  id: number;
  url: string; // /uploads-relative; resolve with attachmentUrl()
  filename: string;
  content_type: string;
  size_bytes: number;
};

export type ReactionGroup = {
  emoji: string;
  user_ids: number[];
};

/** Resolve a (possibly relative) attachment url against the API origin. */
export function attachmentUrl(url: string): string {
  return url.startsWith("http") ? url : `${API}${url}`;
}

export function isImageAttachment(a: AttachmentInfo): boolean {
  return a.content_type.startsWith("image/");
}

/** Local-only delivery state for optimistic messages. */
export type LocalStatus = "sending" | "sent" | "failed";

export type ChatMessage = {
  id: number;
  forum_id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  reply_to: ReplyPreview | null;
  attachments: AttachmentInfo[];
  reactions: ReactionGroup[];
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  // client-side only:
  client_id?: string;
  _status?: LocalStatus;
};

export type ForumMember = {
  id: number;
  full_name: string;
  role: string;
  is_online: boolean;
};

export type ForumDetail = {
  id: number;
  name: string;
  description: string | null;
  domain: string | null;
  creator_id: number;
  created_at: string;
  member_count: number;
  members: ForumMember[];
  current_user_role: string;
  last_read_message_id: number;
};

// ── REST client ──────────────────────────────────────────────────────────────
export async function apiGetForumDetail(token: string, forumId: number): Promise<ForumDetail> {
  const res = await fetch(`${API}/forums/${forumId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { detail?: string }).detail ?? "Failed to load forum");
  return json as ForumDetail;
}

/**
 * History page in ascending (oldest → newest) order. Pass `before` (a message
 * id) to load the page that ends just before it. A returned length === limit
 * implies there may be more older messages.
 */
export async function apiGetMessages(
  token: string,
  forumId: number,
  before?: number,
  limit = 30,
): Promise<ChatMessage[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (before !== undefined) params.set("before", String(before));
  const res = await fetch(`${API}/forums/${forumId}/messages?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function apiMarkRead(
  token: string,
  forumId: number,
  lastReadMessageId: number,
): Promise<void> {
  await fetch(`${API}/forums/${forumId}/read`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ last_read_message_id: lastReadMessageId }),
  }).catch(() => {});
}

// ── attachments ──────────────────────────────────────────────────────────────
export async function apiUploadAttachment(
  token: string,
  forumId: number,
  file: File,
): Promise<AttachmentInfo> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API}/forums/${forumId}/attachments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }, // no Content-Type — browser sets multipart boundary
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { detail?: string }).detail ?? "Upload failed");
  return json as AttachmentInfo;
}

export async function apiListAttachments(
  token: string,
  forumId: number,
): Promise<AttachmentInfo[]> {
  const res = await fetch(`${API}/forums/${forumId}/attachments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

// ── search ───────────────────────────────────────────────────────────────────
export async function apiSearchMessages(
  token: string,
  forumId: number,
  q: string,
  limit = 25,
): Promise<ChatMessage[]> {
  const params = new URLSearchParams({ q, limit: String(limit) });
  const res = await fetch(`${API}/forums/${forumId}/messages/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

// ── forum settings / membership ───────────────────────────────────────────────
/** Subset returned by PATCH /forums/{id} (backend ForumResponse). */
export type ForumSummary = {
  id: number;
  name: string;
  description: string | null;
  domain: string | null;
  creator_id: number;
  created_at: string;
  member_count: number;
};

export async function apiUpdateForum(
  token: string,
  forumId: number,
  data: { name?: string; description?: string },
): Promise<ForumSummary> {
  const res = await fetch(`${API}/forums/${forumId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { detail?: string }).detail ?? "Failed to update forum");
  return json as ForumSummary;
}

export async function apiLeaveForum(token: string, forumId: number): Promise<void> {
  const res = await fetch(`${API}/forums/${forumId}/leave`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 204) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as { detail?: string }).detail ?? "Failed to leave forum");
  }
}

export type InviteLink = { token: string; url: string };

export async function apiCreateInviteLink(
  token: string,
  forumId: number,
): Promise<InviteLink> {
  const res = await fetch(`${API}/forums/${forumId}/invite-link`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { detail?: string }).detail ?? "Failed to create link");
  return json as InviteLink;
}

export async function apiJoinForum(token: string, joinToken: string): Promise<number> {
  const res = await fetch(`${API}/forums/join/${encodeURIComponent(joinToken)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { detail?: string }).detail ?? "Invalid invite link");
  return (json as { forum_id: number }).forum_id;
}
