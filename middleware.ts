import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const currentUser = request.cookies.get("session")
  const pathname = request.nextUrl.pathname

  // Public routes accessible to everyone
  const publicRoutes = ["/signin", "/signup"]

  // If trying to access a public route while logged in, redirect to dashboard
  if (currentUser && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // If trying to access a protected route while not logged in, redirect to signin
  if (!currentUser && !publicRoutes.includes(pathname) && pathname !== "/") {
    return NextResponse.redirect(new URL("/signin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
