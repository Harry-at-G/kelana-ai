"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { type Trip, CATEGORY_COLOR } from "../../components/TripCard";
import { getTrip } from "../../../services/tripService";

/**
 * Split the full AI markdown into one chunk per day.
 * Handles headings like: "## Day 1 ...", "**Day 1 ...**", "Day 1:"
 */
function splitDays(text: string): string[] {
  const chunks = text.split(/(?=(?:^|\n)\s*(?:#{1,4} |\*{0,2})Day \d+)/i);
  return chunks.map((c) => c.trim()).filter(Boolean);
}

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip]       = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  async function fetchTrip() {
    setLoading(true);
    setError(null);
    try {
      const data = await getTrip(id);
      setTrip(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (id) fetchTrip(); }, [id]);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-lg">

        {/* Back link */}
        <Link
          href="/trips"
          className="inline-flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 mb-6 transition-colors"
        >
          ← My Trips
        </Link>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-pulse">
            <div className="h-5 bg-gray-100 rounded-full w-1/2" />
            <div className="grid grid-cols-3 gap-2">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
            </div>
            {[100,80,90,70,85].map((w, i) => (
              <div key={i} className="h-3 bg-gray-100 rounded-full" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">😕</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-red-700">Could not load trip</span>
                <span className="text-sm text-red-500">Check your connection and try again.</span>
              </div>
            </div>
            <p className="text-xs text-red-400 bg-red-100 rounded-lg px-3 py-2">{error}</p>
            <button
              onClick={fetchTrip}
              className="self-start bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl px-5 py-2 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Detail card */}
        {!loading && trip && (
          <div className="flex flex-col gap-4">

            {/* Header */}
            <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-xl font-bold text-gray-800">{trip.destination}</h2>
                  <span className="text-xs text-gray-400">
                    {new Date(trip.created_at).toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${CATEGORY_COLOR[trip.category] ?? "bg-gray-100 text-gray-600"}`}>
                  {trip.category}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="Days"         value={String(trip.days)} />
                <Stat label="Budget"       value={`USD ${trip.budget.toLocaleString()}`} />
                <Stat label="Daily Budget" value={`USD ${trip.daily_budget.toFixed(0)}`} />
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4">
                <span className="text-xs font-bold text-blue-500 tracking-widest uppercase">
                  AI Recommendation
                </span>

                <div className="mt-3 flex flex-col gap-3">
                  {splitDays(trip.ai_recommendation).map((dayText, i, arr) => (
                    <div key={i} className="bg-blue-50 rounded-xl px-4 py-3">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => <p className="text-sm font-bold text-blue-500 mb-3">{children}</p>,
                          h2: ({ children }) => <p className="text-sm font-bold text-blue-500 mb-3">{children}</p>,
                          h3: ({ children }) => <p className="text-sm font-bold text-gray-800 mt-3 mb-1">{children}</p>,
                          h4: ({ children }) => <p className="text-sm font-bold text-gray-800 mt-3 mb-1">{children}</p>,
                          p:  ({ children }) => <p className="text-sm text-gray-700 mb-1 leading-relaxed">{children}</p>,
                          strong: ({ children }) => <strong className="font-bold text-gray-800">{children}</strong>,
                          ul: ({ children }) => <ul className="flex flex-col gap-1 mt-1 mb-1">{children}</ul>,
                          li: ({ children }) => (
                            <li className="flex gap-2 text-sm text-gray-600 list-none">
                              <span className="text-gray-400 shrink-0 mt-0.5">•</span>
                              <span>{children}</span>
                            </li>
                          ),
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

          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl py-2 px-1 flex flex-col items-center gap-0.5">
      <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-semibold text-gray-700">{value}</span>
    </div>
  );
}
