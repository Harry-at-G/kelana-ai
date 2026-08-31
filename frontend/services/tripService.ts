import { type Trip } from "../components/TripCard";
import { getToken } from "./authService";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export interface CreateTripPayload {
  destination:  string;
  days:         number;
  budget:       number;
  travel_style: string;
}

/** Build auth headers, throwing if no token is stored. */
function authHeaders(): HeadersInit {
  const token = getToken();
  if (!token) throw new Error("Not authenticated. Please sign in.");
  return {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

/**
 * POST /api/v1/trips — create a new trip and get the AI itinerary.
 */
export async function createTrip(payload: CreateTripPayload): Promise<Trip> {
  const res = await fetch(`${BASE_URL}/trips`, {
    method:  "POST",
    headers: authHeaders(),
    body:    JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail ?? `Error ${res.status}`);
  }

  return res.json();
}

/**
 * GET /api/v1/trips — list trips for the authenticated user, sorted newest first.
 */
export async function listTrips(): Promise<Trip[]> {
  const res = await fetch(`${BASE_URL}/trips`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail ?? `Error ${res.status}`);
  }

  const data: Trip[] = await res.json();
  return data.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * GET /api/v1/trips/:id — fetch a single trip by ID.
 */
export async function getTrip(id: string | number): Promise<Trip> {
  const res = await fetch(`${BASE_URL}/trips/${id}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail ?? `Error ${res.status}`);
  }

  return res.json();
}
