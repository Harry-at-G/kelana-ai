import { type Trip } from "../components/TripCard";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export interface CreateTripPayload {
  destination: string;
  days: number;
  budget: number;
  travel_style: string;
}

/**
 * POST /api/v1/trips — create a new trip and get the AI itinerary.
 */
export async function createTrip(payload: CreateTripPayload): Promise<Trip> {
  const res = await fetch(`${BASE_URL}/trips`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail ?? `Error ${res.status}`);
  }

  return res.json();
}

/**
 * GET /api/v1/trips — list all trips, sorted newest first.
 */
export async function listTrips(): Promise<Trip[]> {
  const res = await fetch(`${BASE_URL}/trips`);

  if (!res.ok) {
    throw new Error(`Error ${res.status} — GET ${BASE_URL}/trips`);
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
  const res = await fetch(`${BASE_URL}/trips/${id}`);

  if (!res.ok) {
    throw new Error(`Error ${res.status} — GET ${BASE_URL}/trips/${id}`);
  }

  return res.json();
}
