"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser } from "../../services/authService";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // loginUser() calls saveSession() internally — stores token + user
      await loginUser({ email: form.email, password: form.password });
      // Notify the Navbar in the same tab
      window.dispatchEvent(new Event("storage"));
      router.push("/trips");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-4xl">✈️</span>
          <h1 className="text-2xl font-extrabold text-blue-500">KelanaAI</h1>
          <p className="text-sm text-gray-400">Sign in to plan your next adventure</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="w-full bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4"
        >
          <h2 className="text-lg font-bold text-gray-800">Welcome back</h2>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 tracking-widest uppercase">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              className="bg-gray-100 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 tracking-widest uppercase">
              Password
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="bg-gray-100 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
              <span className="text-lg leading-none mt-0.5">😕</span>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 bg-blue-400 hover:bg-blue-500 disabled:bg-blue-300 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-sm text-gray-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-blue-500 hover:text-blue-600 font-medium transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
