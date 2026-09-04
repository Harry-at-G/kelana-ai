import { getToken } from "./authService";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

function authHeaders(): HeadersInit {
  const token = getToken();
  if (!token) throw new Error("Not authenticated. Please sign in.");
  return {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Source {
  title: string;
  uri:   string;
  score: number;
}

export interface TripPlan {
  destination:  string;
  days:         number;
  budget:       number;
  travel_style: string;
  itinerary:    string;
}

export interface ChatMessage {
  id:         number;
  role:       "user" | "assistant";
  content:    string;
  created_at: string;
  sources?:   Source[];
  trip_plan?: TripPlan;
}

export interface Conversation {
  id:         number;
  title:      string;
  created_at: string;
  messages?:  ChatMessage[];
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** POST /api/v1/conversations — create a new conversation topic. */
export async function createConversation(title: string): Promise<Conversation> {
  const res = await fetch(`${BASE_URL}/conversations`, {
    method:  "POST",
    headers: authHeaders(),
    body:    JSON.stringify({ title }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail ?? `Error ${res.status}`);
  }
  return res.json();
}

/** GET /api/v1/conversations — list all conversations for the current user. */
export async function listConversations(): Promise<Conversation[]> {
  const res = await fetch(`${BASE_URL}/conversations`, { headers: authHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail ?? `Error ${res.status}`);
  }
  return res.json();
}

/** GET /api/v1/conversations/:id — get a conversation with all messages. */
export async function getConversation(id: number): Promise<Conversation> {
  const res = await fetch(`${BASE_URL}/conversations/${id}`, { headers: authHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail ?? `Error ${res.status}`);
  }
  return res.json();
}

/** POST /api/v1/conversations/:id/messages — send a message, get AI reply. */
export async function sendMessage(convId: number, content: string): Promise<ChatMessage> {
  const res = await fetch(`${BASE_URL}/conversations/${convId}/messages`, {
    method:  "POST",
    headers: authHeaders(),
    body:    JSON.stringify({ content }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail ?? `Error ${res.status}`);
  }
  return res.json();
}
