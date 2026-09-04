"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredUser, clearSession, type AuthUser } from "../services/authService";

const NAV_ITEMS = [
  { label: "Plan a Trip", href: "/" },
  { label: "My Trips",    href: "/trips" },
  { label: "Ask",         href: "/assistant" },
  { label: "Chat",        href: "/chat" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  // Re-read auth state on route changes AND when localStorage is updated
  useEffect(() => {
    setUser(getStoredUser());
  }, [pathname]);

  useEffect(() => {
    // Fires when another tab or the login page writes to localStorage
    function onStorage(e: StorageEvent) {
      if (e.key === "auth_user" || e.key === "auth_token") {
        setUser(getStoredUser());
      }
    }
    window.addEventListener("storage", onStorage);

    // Also read immediately on mount in case we just navigated here
    setUser(getStoredUser());

    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function handleLogout() {
    clearSession();
    setUser(null);
    router.push("/login");
  }

  return (
    <header className="w-full bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 font-extrabold text-blue-500 text-lg">
          ✈️ KelanaAI
        </Link>

        <div className="flex items-center gap-2">
          {/* Welcome message — shown when logged in */}
          {user && (
            <span className="hidden sm:block text-sm text-gray-400">
              Welcome back, <span className="font-semibold text-gray-700">{user.name.split(" ")[0]}</span> 🔥
            </span>
          )}
          {/* Nav links — only when logged in */}
          {user && (
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map(({ label, href }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      active
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-500 hover:text-blue-500 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Auth section */}
          {user ? (
            <div className="flex items-center gap-2 ml-2">
              <Link
                href="/profile"
                className="flex items-center gap-2 bg-gray-50 hover:bg-blue-50 rounded-full px-3 py-1.5 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                  {user.name}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-400 hover:text-red-500 transition-colors px-2 py-1.5"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-2 px-4 py-1.5 bg-blue-400 hover:bg-blue-500 text-white text-sm font-semibold rounded-full transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
