import { NextResponse, type NextRequest } from 'next/server';

/**
 * Auth tokens live in localStorage (client-side), so route gating happens in
 * the dashboard layout. This middleware normalises the root path; extend it
 * if you move to cookie-based sessions.
 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
