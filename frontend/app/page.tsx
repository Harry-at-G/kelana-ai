"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface TripResult {
  id: number;
  destination: string;
  days: number;
  budget: number;
  category: string;
  daily_budget: number;
  ai_recommendation: string;
  created_at: string;
}

const TRAVEL_STYLES = [
  "Adventure", "Backpacker", "Business", "Cultural", "Family", "Luxury", "Relaxed",
];

export default function Home() {
  const [form, setForm] = useState({
    destination: "",
    budget: "",
    days: "",
    travel_style: "",
  });
  const [result, setResult] = useState<TripResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("http://localhost:8000/api/v1/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: form.destination,
          budget: parseFloat(form.budget),
          days: parseInt(form.days, 10),
          travel_style: form.travel_style,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.detail ?? `Error ${res.status}`);
      }

      const data: TripResult = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRetry() {
    await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      {/* Header */}
      <h1 className="text-4xl font-bold text-blue-500 mb-1">KelanaAI</h1>
      <p className="text-gray-400 text-sm mb-8">Plan your next adventure</p>

      {/* Form card */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 tracking-widest uppercase">
            Destination
          </label>
          <input
            name="destination"
            value={form.destination}
            onChange={handleChange}
            placeholder="e.g. Japan"
            required
            className="bg-gray-100 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 tracking-widest uppercase">
            Budget (USD)
          </label>
          <input
            name="budget"
            type="number"
            min="0"
            value={form.budget}
            onChange={handleChange}
            placeholder="e.g. 2000"
            required
            className="bg-gray-100 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 tracking-widest uppercase">
            Days
          </label>
          <input
            name="days"
            type="number"
            min="1"
            value={form.days}
            onChange={handleChange}
            placeholder="e.g. 5"
            required
            className="bg-gray-100 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 tracking-widest uppercase">
            Travel Style
          </label>
          <select
            name="travel_style"
            value={form.travel_style}
            onChange={handleChange}
            required
            className="bg-gray-100 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-300 appearance-none"
          >
            <option value="" disabled>Select a style</option>
            {TRAVEL_STYLES.map((style) => (
              <option key={style} value={style}>{style}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 bg-blue-400 hover:bg-blue-500 disabled:bg-blue-300 text-white font-semibold rounded-xl py-3 transition-colors"
        >
          {loading ? "Generating…" : "Generate AI Trip"}
        </button>
      </form>

      {/* Loading state */}
      {loading && (
        <div className="w-full max-w-md mt-6 bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center gap-4">
          {/* Spinner */}
          <div className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-blue-400 animate-spin" />
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-sm font-semibold text-gray-700">Generating your trip plan…</span>
            <span className="text-xs text-gray-400">This may take a few seconds while AI crafts your itinerary</span>
          </div>
          {/* Skeleton lines */}
          <div className="w-full flex flex-col gap-2 mt-2">
            {[100, 80, 90, 70, 85].map((w, i) => (
              <div
                key={i}
                className="h-3 bg-gray-100 rounded-full animate-pulse"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </div>
      )}
      {error && (
        <div className="w-full max-w-md mt-4 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none">😕</span>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-red-700">Something went wrong</span>
              <span className="text-sm text-red-500">
                We couldn&apos;t generate your trip plan. This is usually a temporary hiccup — please try again.
              </span>
            </div>
          </div>
          {/* Technical detail, subtle */}
          <p className="text-xs text-red-400 bg-red-100 rounded-lg px-3 py-2 break-words">
            {error}
          </p>
          <button
            onClick={handleRetry}
            className="self-start bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl px-5 py-2 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Result card */}
      {result && (
        <div className="w-full max-w-md mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Header bar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-700">
              Destination: <span className="font-bold">{result.destination}</span>
            </span>
            <span className="text-sm font-semibold text-gray-700">
              Budget: <span className="font-bold">USD {result.budget.toLocaleString()}</span>
            </span>
          </div>

          {/* AI Recommendation */}
          <div className="px-5 py-4">
            <span className="text-xs font-bold text-blue-500 tracking-widest uppercase">
              AI Recommendation
            </span>

            <div className="mt-3 flex flex-col gap-3">
              {splitDays(result.ai_recommendation).map((dayText, i, arr) => (
                <div key={i} className="bg-blue-50 rounded-xl px-4 py-3">
                  <ReactMarkdown
                    components={{
                      // Day-level heading (## Day 1: ...) — blue bold small
                      h1: ({ children }) => (
                        <p className="text-sm font-bold text-blue-500 mb-3">{children}</p>
                      ),
                      h2: ({ children }) => (
                        <p className="text-sm font-bold text-blue-500 mb-3">{children}</p>
                      ),
                      // Time-period sub-heading (### Morning) — dark bold
                      h3: ({ children }) => (
                        <p className="text-xs font-bold text-gray-800 mt-3 mb-1">{children}</p>
                      ),
                      h4: ({ children }) => (
                        <p className="text-xs font-bold text-gray-800 mt-3 mb-1">{children}</p>
                      ),
                      // Paragraphs — covers **Morning** used as bold-only line
                      p: ({ children }) => (
                        <p className="text-sm text-gray-700 mb-1 leading-relaxed">{children}</p>
                      ),
                      // Bold inline (**Morning**) — dark bold
                      strong: ({ children }) => (
                        <strong className="font-bold text-gray-800">{children}</strong>
                      ),
                      // Bullet list container
                      ul: ({ children }) => (
                        <ul className="flex flex-col gap-1 mt-1 mb-1">{children}</ul>
                      ),
                      // Bullet item — custom bullet dot, no default marker
                      li: ({ children }) => (
                        <li className="flex gap-2 text-sm text-gray-600 list-none">
                          <span className="text-gray-400 shrink-0 mt-0.5">•</span>
                          <span>{children}</span>
                        </li>
                      ),
                      // Only render <hr> on the last card (summary separator)
                      hr: () => i === arr.length - 1
                        ? <hr className="my-2 border-gray-300" />
                        : null,
                    }}
                  >
                    {dayText}
                  </ReactMarkdown>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/**
 * Split the full AI markdown into one chunk per day.
 * Handles headings like: "## Day 1 ...", "**Day 1 ...**", "Day 1:"
 */
function splitDays(text: string): string[] {
  const chunks = text.split(/(?=(?:^|\n)\s*(?:#{1,4} |\*{0,2})Day \d+)/i);
  return chunks.map((c) => c.trim()).filter(Boolean);
}
