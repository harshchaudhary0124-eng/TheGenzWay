const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export const TOKEN_KEY = "tgw_token";

export type TokenPayload = { access_token: string; token_type: string };

export type UserProfile = {
  id: number;
  full_name: string;
  email: string;
  qualification: string;
  interested_domains: string[];
  country: string;
  city: string;
  profile_slug: string;
  onboarding_completed: boolean;
  onboarding_answers: Record<string, unknown>;
  created_at: string;
};

export async function apiRegister(data: {
  full_name: string;
  email: string;
  password: string;
  qualification: string;
  interested_domains: string[];
  country: string;
  city: string;
}): Promise<TokenPayload> {
  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { detail?: string }).detail ?? "Registration failed");
  return json as TokenPayload;
}

export async function apiLogin(email: string, password: string): Promise<TokenPayload> {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { detail?: string }).detail ?? "Login failed");
  return json as TokenPayload;
}

export async function apiGetMe(token: string): Promise<UserProfile> {
  const res = await fetch(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Unauthorized");
  return res.json() as Promise<UserProfile>;
}

export function saveToken(token: string): void {
  if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
}

export async function apiSaveOnboarding(
  token: string,
  domainsData: Array<{ domain: string; answers: Record<string, string> }>,
): Promise<UserProfile> {
  const res = await fetch(`${API}/auth/onboarding`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ domains_data: domainsData }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { detail?: string }).detail ?? "Failed to save onboarding");
  return json as UserProfile;
}
