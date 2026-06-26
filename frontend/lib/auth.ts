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
  const user = (await res.json()) as UserProfile;
  setCachedUser(user);
  return user;
}

const USER_CACHE_KEY = "tgw_user";

/** Last known profile, kept in sessionStorage so protected pages can paint
 *  instantly on navigation while apiGetMe revalidates in the background. */
export function getCachedUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function setCachedUser(user: UserProfile): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  } catch {
    /* storage unavailable — non-fatal */
  }
}

export function clearCachedUser(): void {
  if (typeof window !== "undefined") sessionStorage.removeItem(USER_CACHE_KEY);
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
  clearCachedUser();
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
