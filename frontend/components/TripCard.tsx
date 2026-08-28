import Link from "next/link";

export interface Trip {
  id: number;
  destination: string;
  days: number;
  budget: number;
  category: string;
  daily_budget: number;
  travel_style: string | null;
  ai_recommendation: string;
  created_at: string;
}

export const CATEGORY_COLOR: Record<string, string> = {
  Backpacker: "bg-green-100 text-green-700",
  Standard:   "bg-blue-100 text-blue-700",
  Luxury:     "bg-purple-100 text-purple-700",
};

const CATEGORY_ICON: Record<string, string> = {
  Backpacker: "🎒",
  Standard:   "⭐",
  Luxury:     "💎",
};

const TRAVEL_STYLE_COLOR: Record<string, string> = {
  Family:      "bg-yellow-100 text-yellow-700",
  Solo:        "bg-orange-100 text-orange-700",
  Couple:      "bg-pink-100 text-pink-700",
  Adventure:   "bg-red-100 text-red-700",
  Backpacker:  "bg-green-100 text-green-700",
  Business:    "bg-slate-100 text-slate-700",
  Cultural:    "bg-indigo-100 text-indigo-700",
  Luxury:      "bg-purple-100 text-purple-700",
  Relaxed:     "bg-teal-100 text-teal-700",
};

const TRAVEL_STYLE_ICON: Record<string, string> = {
  Family:      "👨‍👩‍👧",
  Solo:        "🧍",
  Couple:      "💑",
  Adventure:   "🧗",
  Backpacker:  "🎒",
  Business:    "💼",
  Cultural:    "🏛️",
  Luxury:      "✨",
  Relaxed:     "🏖️",
};

// Country/region keywords → flag emoji
const DESTINATION_FLAGS: [string[], string][] = [
  [["japan", "tokyo", "osaka", "kyoto"],                   "🇯🇵"],
  [["indonesia", "bali", "jakarta", "lombok", "bandung", "yogyakarta", "surabaya", "lombok", "komodo"], "🇮🇩"],
  [["france", "paris"],                                    "🇫🇷"],
  [["italy", "rome", "milan", "venice", "florence"],       "🇮🇹"],
  [["spain", "barcelona", "madrid"],                       "🇪🇸"],
  [["thailand", "bangkok", "phuket", "chiang mai"],        "🇹🇭"],
  [["vietnam", "hanoi", "ho chi minh", "saigon", "da nang"], "🇻🇳"],
  [["singapore"],                                          "🇸🇬"],
  [["malaysia", "kuala lumpur", "penang", "kl"],           "🇲🇾"],
  [["australia", "sydney", "melbourne", "brisbane"],       "🇦🇺"],
  [["new zealand", "auckland", "queenstown"],              "🇳🇿"],
  [["usa", "united states", "new york", "los angeles", "san francisco", "chicago"], "🇺🇸"],
  [["uk", "united kingdom", "london", "england"],          "🇬🇧"],
  [["germany", "berlin", "munich"],                        "🇩🇪"],
  [["netherlands", "amsterdam"],                           "🇳🇱"],
  [["greece", "athens", "santorini"],                      "🇬🇷"],
  [["turkey", "istanbul"],                                 "🇹🇷"],
  [["india", "delhi", "mumbai", "goa", "rajasthan"],       "🇮🇳"],
  [["china", "beijing", "shanghai", "hong kong"],          "🇨🇳"],
  [["south korea", "korea", "seoul"],                      "🇰🇷"],
  [["taiwan", "taipei"],                                   "🇹🇼"],
  [["philippines", "manila", "cebu", "palawan"],           "🇵🇭"],
  [["cambodia", "siem reap", "phnom penh"],                "🇰🇭"],
  [["nepal", "kathmandu"],                                 "🇳🇵"],
  [["switzerland", "zurich", "geneva"],                    "🇨🇭"],
  [["portugal", "lisbon", "porto"],                        "🇵🇹"],
  [["maldives"],                                           "🇲🇻"],
  [["egypt", "cairo"],                                     "🇪🇬"],
  [["morocco", "marrakech"],                               "🇲🇦"],
  [["south africa", "cape town", "johannesburg"],          "🇿🇦"],
  [["brazil", "rio", "são paulo"],                         "🇧🇷"],
  [["mexico", "cancun", "mexico city"],                    "🇲🇽"],
  [["peru", "lima", "machu picchu"],                       "🇵🇪"],
  [["canada", "toronto", "vancouver"],                     "🇨🇦"],
  [["sweden", "stockholm"],                                "🇸🇪"],
  [["norway", "oslo"],                                     "🇳🇴"],
  [["iceland", "reykjavik"],                               "🇮🇸"],
  [["austria", "vienna"],                                  "🇦🇹"],
  [["czech", "prague"],                                    "🇨🇿"],
  [["hungary", "budapest"],                                "🇭🇺"],
  [["poland", "warsaw", "krakow"],                         "🇵🇱"],
  [["russia", "moscow", "st. petersburg"],                 "🇷🇺"],
  [["uae", "dubai", "abu dhabi"],                          "🇦🇪"],
  [["sri lanka"],                                          "🇱🇰"],
  [["myanmar", "yangon", "bagan"],                         "🇲🇲"],
  [["laos", "luang prabang"],                              "🇱🇦"],
  [["jordan", "petra", "amman"],                           "🇯🇴"],
  [["israel", "tel aviv", "jerusalem"],                    "🇮🇱"],
  [["argentina", "buenos aires"],                          "🇦🇷"],
  [["chile", "santiago"],                                  "🇨🇱"],
];

/**
 * Returns a flag emoji for a destination string, or 🌏 as fallback.
 */
export function getDestinationFlag(destination: string): string {
  const lower = destination.toLowerCase();
  for (const [keywords, flag] of DESTINATION_FLAGS) {
    if (keywords.some((kw) => lower.includes(kw))) return flag;
  }
  return "🌏";
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl py-2 px-1 flex flex-col items-center gap-0.5">
      <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-semibold text-gray-700">{value}</span>
    </div>
  );
}

export default function TripCard({ trip }: { trip: Trip }) {
  const flag = getDestinationFlag(trip.destination);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {/* Flag / landmark icon */}
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-2xl shrink-0">
            {flag}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-base font-bold text-gray-800">{trip.destination}</span>
            <span className="text-xs text-gray-400">
              {new Date(trip.created_at).toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "numeric",
              })}
            </span>
            {trip.travel_style && (
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${
                TRAVEL_STYLE_COLOR[trip.travel_style] ?? "bg-gray-100 text-gray-600"
              }`}>
                <span>{TRAVEL_STYLE_ICON[trip.travel_style] ?? "🌍"}</span>
                {trip.travel_style}
              </span>
            )}
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
            CATEGORY_COLOR[trip.category] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          <span>{CATEGORY_ICON[trip.category] ?? "📍"}</span>
          {trip.category}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Days"         value={String(trip.days)} />
        <Stat label="Budget"       value={`USD ${trip.budget.toLocaleString()}`} />
        <Stat label="Daily Budget" value={`USD ${trip.daily_budget.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
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
