"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TripCard, { type Trip } from "../../components/TripCard";
import { listTrips } from "../../services/tripService";
import { useAuthGuard } from "../../hooks/useAuthGuard";

const PAGE_SIZE = 10;

export default function MyTripsPage() {
  useAuthGuard();
  const router = useRouter();
  const [trips, setTrips]     = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [query, setQuery]     = useState("");
  const [page, setPage]       = useState(1);

  async function fetchTrips() {
    setLoading(true);
    setError(null);
    try {
      const data = await listTrips();
      setTrips(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      if (msg.includes("Not authenticated") || msg.includes("401")) {
        router.push("/login");
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTrips(); }, []);

  // Reset to page 1 whenever the search query changes
  useEffect(() => { setPage(1); }, [query]);

  // Filter by destination, category, or travel_style
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return trips;
    return trips.filter(
      (t) =>
        t.destination.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.travel_style?.toLowerCase().includes(q) ?? false)
    );
  }, [trips, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">My Trips</h2>
        <p className="text-sm text-gray-400 mb-4">All your AI-generated itineraries</p>

        {/* Search bar */}
        {!loading && !error && trips.length > 0 && (
          <div className="relative mb-5">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by destination or travel style…"
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-2 animate-pulse">
                <div className="h-4 bg-gray-100 rounded-full w-1/2" />
                <div className="h-3 bg-gray-100 rounded-full w-1/3" />
                <div className="h-3 bg-gray-100 rounded-full w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">😕</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-red-700">Could not load trips</span>
                <span className="text-sm text-red-500">Check your connection and try again.</span>
              </div>
            </div>
            <p className="text-xs text-red-400 bg-red-100 rounded-lg px-3 py-2">{error}</p>
            <button
              onClick={fetchTrips}
              className="self-start bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl px-5 py-2 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state — no trips at all */}
        {!loading && !error && trips.length === 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center gap-4 text-center">
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-4xl">
              🗺️
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-gray-800 font-bold text-lg">No trips planned yet</p>
              <p className="text-sm text-gray-400 max-w-xs">
                Your saved itineraries will appear here. Use KelanaAI to generate a personalised day-by-day plan for any destination.
              </p>
            </div>
            <div className="w-full grid grid-cols-3 gap-3 mt-1">
              {[
                { icon: "🤖", title: "AI-powered", desc: "Crafted by Amazon Nova" },
                { icon: "💰", title: "Budget-aware", desc: "Tailored to your spend" },
                { icon: "🎒", title: "Any style", desc: "Adventure to Luxury" },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="bg-gray-50 rounded-xl py-3 px-2 flex flex-col items-center gap-1">
                  <span className="text-2xl">{icon}</span>
                  <span className="text-xs font-semibold text-gray-700">{title}</span>
                  <span className="text-xs text-gray-400 leading-tight">{desc}</span>
                </div>
              ))}
            </div>
            <Link
              href="/"
              className="mt-2 w-full bg-blue-400 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl py-3 transition-colors"
            >
              ✈️ Plan your first trip
            </Link>
          </div>
        )}

        {/* No search results */}
        {!loading && !error && trips.length > 0 && filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center gap-2 text-center">
            <span className="text-3xl">🔎</span>
            <p className="text-gray-700 font-semibold">No trips match &ldquo;{query}&rdquo;</p>
            <p className="text-sm text-gray-400">Try a different destination or travel style.</p>
            <button
              onClick={() => setQuery("")}
              className="mt-1 text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Trip list */}
        {!loading && !error && paginated.length > 0 && (
          <>
            {/* Result count */}
            <p className="text-xs text-gray-400 mb-3">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} trip{filtered.length !== 1 ? "s" : ""}
            </p>

            <div className="flex flex-col gap-4">
              {paginated.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  ← Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors shadow-sm ${
                      p === page
                        ? "bg-blue-400 text-white border border-blue-400"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
