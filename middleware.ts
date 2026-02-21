import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect /dashboard routes (except /dashboard/login)
  if (pathname.startsWith("/dashboard") && pathname !== "/dashboard/login") {
    const token = request.cookies.get("auth_token")?.value

    if (!token) {
      const url = new URL("/dashboard/login", request.url)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
