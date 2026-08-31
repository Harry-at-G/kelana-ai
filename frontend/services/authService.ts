const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export interface AuthUser {
  id:    number;
  name:  string;
  email: string;
}

export interface LoginResponse {
  access_token: string;
  token_type:   string;
  user:         AuthUser;
}

export interface RegisterPayload {
  name:     string;
  email:    string;
  password: string;
}

export interface LoginPayload {
  email:    string;
  password: string;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const TOKEN_KEY = "auth_token";
const USER_KEY  = "auth_user";

export function saveSession(response: LoginResponse): void {
  localStorage.setItem(TOKEN_KEY, response.access_token);
  localStorage.setItem(USER_KEY,  JSON.stringify(response.user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 */
export async function registerUser(payload: RegisterPayload): Promise<AuthUser> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail ?? `Error ${res.status}`);
  }

  return res.json();
}

/**
 * GET /api/v1/auth/me — fetch current user profile + trip count.
 */
export interface UserProfile {
  id:          number;
  name:        string;
  email:       string;
  created_at:  string;
  total_trips: number;
}

export async function getMe(): Promise<UserProfile> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated. Please sign in.");

  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail ?? `Error ${res.status}`);
  }

  return res.json();
}
export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail ?? `Error ${res.status}`);
  }

  const response: LoginResponse = await res.json();
  saveSession(response);
  return response;
}
