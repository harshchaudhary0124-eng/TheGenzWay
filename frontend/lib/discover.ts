const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export type MatchedDomain = {
  domain: string;
  onboarding_answers: Record<string, string>;
  identity_summary: string;
  why_matched: string;
};

export type DiscoveredPerson = {
  id: number;
  full_name: string;
  city: string;
  country: string;
  matched_domains: MatchedDomain[];
  interested_domains: string[];
  profile_slug: string;
};

export async function apiGetPersonProfile(token: string, userId: number): Promise<DiscoveredPerson> {
  const res = await fetch(`${API}/discover/people/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${body || "Profile not found"}`);
  }
  return res.json() as Promise<DiscoveredPerson>;
}

export async function apiDiscoverPeople(token: string): Promise<DiscoveredPerson[]> {
  const res = await fetch(`${API}/discover/people`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export const DOMAIN_ANSWER_KEYS: Record<string, [string, string, string, string]> = {
  "Entrepreneurship": ["stage", "focus", "context", "intent"],
  "Artificial Intelligence": ["level", "area", "work", "intent"],
  "Software / Development": ["level", "area", "work", "intent"],
  "Design": ["type", "mode", "focus", "intent"],
  "Blockchain / Web3": ["role", "area", "status", "intent"],
  "Product / Startups": ["role", "context", "area", "intent"],
  "Content Creation": ["type", "platform", "stage", "intent"],
  "Marketing / Growth": ["role", "area", "context", "intent"],
  "Finance / Investing": ["role", "area", "interest", "intent"],
  "Research / Deep Tech": ["domain", "role", "work", "intent"],
};

export const DOMAIN_ANSWER_LABELS: Record<string, [string, string, string, string]> = {
  "Entrepreneurship": ["Stage", "Building", "Team size", "Looking for"],
  "Artificial Intelligence": ["Experience", "Focus area", "Current work", "Looking for"],
  "Software / Development": ["Experience", "Specialty", "Current work", "Looking for"],
  "Design": ["Design type", "Work mode", "Focus area", "Looking for"],
  "Blockchain / Web3": ["Role", "Focus area", "Status", "Looking for"],
  "Product / Startups": ["Role", "Context", "Products", "Looking for"],
  "Content Creation": ["Content type", "Platform", "Stage", "Looking for"],
  "Marketing / Growth": ["Role", "Focus area", "Context", "Looking for"],
  "Finance / Investing": ["Role", "Focus area", "Interest", "Looking for"],
  "Research / Deep Tech": ["Domain", "Role", "Current work", "Looking for"],
};
