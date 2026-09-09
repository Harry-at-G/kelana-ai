import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route protection is handled client-side by useAuthGuard hook.
// This proxy is a passthrough to avoid MIDDLEWARE_INVOCATION_FAILED on Vercel.
export function proxy(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
