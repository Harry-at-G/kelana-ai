import { getToken } from "./authService";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export interface Source {
  title: string;
  uri:   string;
  score: number;
}

export interface AskResponse {
  question: string;
  answer:   string;
  sources:  Source[];
}

export async function askKelana(question: string): Promise<AskResponse> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated. Please sign in.");

  const res = await fetch(`${BASE_URL}/ask`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail ?? `Error ${res.status}`);
  }

  return res.json();
}
