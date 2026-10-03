import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getDealer } from "@/lib/dealers";

const PUBLIC_PATHS = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/vehicles") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const dealerId = request.cookies.get("dealer_id")?.value;
  if (!dealerId || !getDealer(dealerId)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image).*)"],
};
