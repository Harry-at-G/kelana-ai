"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "../../services/authService";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await registerUser({ name: form.name, email: form.email, password: form.password });
      router.push("/login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const passwordsMatch = form.confirm === "" || form.password === form.confirm;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-4xl">✈️</span>
          <h1 className="text-2xl font-extrabold text-blue-500">KelanaAI</h1>
          <p className="text-sm text-gray-400">Create your account to get started</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="w-full bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4"
        >
          <h2 className="text-lg font-bold text-gray-800">Create account</h2>

          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 tracking-widest uppercase">
              Full Name
            </label>
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
              className="bg-gray-100 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* Email */}
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

          {/* Password */}
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
              minLength={8}
              className="bg-gray-100 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 tracking-widest uppercase">
              Confirm Password
            </label>
            <input
              name="confirm"
              type="password"
              value={form.confirm}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className={`bg-gray-100 rounded-lg px-4 py-3 text-sm text-gray-700 outline-none focus:ring-2 ${
                passwordsMatch ? "focus:ring-blue-300" : "ring-2 ring-red-300 focus:ring-red-300"
              }`}
            />
            {!passwordsMatch && (
              <span className="text-xs text-red-500 mt-0.5">Passwords do not match</span>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
              <span className="text-lg leading-none mt-0.5">😕</span>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !passwordsMatch}
            className="mt-1 bg-blue-400 hover:bg-blue-500 disabled:bg-blue-300 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        {/* Login link */}
        <p className="text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-500 hover:text-blue-600 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
