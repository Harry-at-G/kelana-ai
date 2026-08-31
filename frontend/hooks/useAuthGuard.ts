"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "../services/authService";

/**
 * Client-side auth guard. Redirects to /login if no token is found.
 * Use this at the top of every protected page as a safety net alongside middleware.
 */
export function useAuthGuard() {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    }
  }, []);
}
