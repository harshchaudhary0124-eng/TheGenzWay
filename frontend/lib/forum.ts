import { trackForumCreated, trackForumInvited, trackForumJoined } from "@/lib/analytics";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

function authHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export type DiscussionForum = {
  id: number;
  name: string;
  description?: string;
  domain?: string;
  creator_id: number;
  created_at: string;
  member_count: number;
};

export type ForumInvite = {
  id: number;
  sender: {
    id: number;
    full_name: string;
    city: string;
    country: string;
    interested_domains: string[];
    matched_domains: import("@/lib/discover").MatchedDomain[];
  };
  forum_id: number;
  forum_name: string;
  forum_domain?: string;
  context?: string;
  status: string;
  created_at: string;
};

export async function apiGetMyForums(token: string): Promise<DiscussionForum[]> {
  const res = await fetch(`${API}/forums/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function apiGetInvites(token: string): Promise<ForumInvite[]> {
  const res = await fetch(`${API}/forums/invites`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function apiCreateForum(
  token: string,
  data: { name: string; description?: string; domain?: string },
): Promise<DiscussionForum> {
  const res = await fetch(`${API}/forums`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { detail?: string }).detail ?? "Failed to create forum");
  trackForumCreated();
  return json as DiscussionForum;
}

export async function apiSendInvite(
  token: string,
  data: {
    recipient_id: number;
    forum_id?: number;
    forum_name?: string;
    forum_description?: string;
    forum_domain?: string;
    context?: string;
  },
): Promise<void> {
  const res = await fetch(`${API}/forums/invite`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { detail?: string }).detail ?? "Failed to send invite");
  trackForumInvited();
}

export async function apiAcceptInvite(token: string, inviteId: number): Promise<void> {
  const res = await fetch(`${API}/forums/invites/${inviteId}/accept`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as { detail?: string }).detail ?? "Failed to accept invite");
  }
  trackForumJoined();
}

export async function apiRejectInvite(token: string, inviteId: number): Promise<void> {
  const res = await fetch(`${API}/forums/invites/${inviteId}/reject`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as { detail?: string }).detail ?? "Failed to reject invite");
  }
}
