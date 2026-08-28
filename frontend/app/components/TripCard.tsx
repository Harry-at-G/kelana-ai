import Link from "next/link";

export interface Trip {
  id: number;
  destination: string;
  days: number;
  budget: number;
  category: string;
  daily_budget: number;
  ai_recommendation: string;
  created_at: string;
}

export const CATEGORY_COLOR: Record<string, string> = {
  Backpacker: "bg-green-100 text-green-700",
  Standard:   "bg-blue-100 text-blue-700",
  Luxury:     "bg-purple-100 text-purple-700",
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl py-2 px-1 flex flex-col items-center gap-0.5">
      <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-semibold text-gray-700">{value}</span>
    </div>
  );
}

export default function TripCard({ trip }: { trip: Trip }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-bold text-gray-800">{trip.destination}</span>
          <span className="text-xs text-gray-400">
            {new Date(trip.created_at).toLocaleDateString("en-US", {
              year: "numeric", month: "short", day: "numeric",
            })}
          </span>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
            CATEGORY_COLOR[trip.category] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {trip.category}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Days"         value={String(trip.days)} />
        <Stat label="Budget"       value={`USD ${trip.budget.toLocaleString()}`} />
        <Stat label="Daily Budget" value={`USD ${trip.daily_budget.toFixed(0)}`} />
      </div>

      {/* View Details button */}
      <Link
        href={`/trips/${trip.id}`}
        className="mt-1 w-full text-center bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-semibold rounded-xl py-2 transition-colors"
      >
        View Details →
      </Link>
    </div>
  );
}
