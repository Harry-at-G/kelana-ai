"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMe, clearSession, type UserProfile } from "../../services/authService";
import { useAuthGuard } from "../../hooks/useAuthGuard";

export default function ProfilePage() {
  useAuthGuard();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await getMe();
        setProfile(data);
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
    fetchProfile();
  }, []);

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-md flex flex-col gap-4">

        <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-3 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-100" />
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-4 bg-gray-100 rounded-full w-1/2" />
                <div className="h-3 bg-gray-100 rounded-full w-2/3" />
              </div>
            </div>
            <div className="h-3 bg-gray-100 rounded-full w-1/3" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">😕</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-red-700">Could not load profile</span>
                <span className="text-sm text-red-500">{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* Profile card */}
        {!loading && profile && (
          <>
            {/* Avatar + identity */}
            <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full bg-blue-400 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-lg font-bold text-gray-800">{profile.name}</span>
                  <span className="text-sm text-gray-400">{profile.email}</span>
                  <span className="text-xs text-gray-400">
                    Member since{" "}
                    {new Date(profile.created_at).toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <StatCard
                  icon="✈️"
                  label="Trips Generated"
                  value={String(profile.total_trips)}
                />
                <StatCard
                  icon="🌏"
                  label="Destinations"
                  value={String(profile.total_trips)}
                />
                <StatCard
                  icon="🤖"
                  label="AI Plans"
                  value={String(profile.total_trips)}
                />
              </div>
            </div>

            {/* Account details */}
            <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Account Details
              </span>
              <InfoRow label="Full Name"  value={profile.name} />
              <InfoRow label="Email"      value={profile.email} />
              <InfoRow label="User ID"    value={`#${profile.id}`} />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Link
                href="/trips"
                className="w-full text-center bg-blue-400 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl py-3 transition-colors"
              >
                View My Trips
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-center bg-white hover:bg-red-50 border border-red-200 text-red-500 text-sm font-semibold rounded-xl py-3 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-blue-50 rounded-xl py-3 px-2 flex flex-col items-center gap-1">
      <span className="text-2xl">{icon}</span>
      <span className="text-lg font-bold text-blue-500">{value}</span>
      <span className="text-xs text-gray-400 leading-tight text-center">{label}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-700">{value}</span>
    </div>
  );
}
