import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only apply protection in production (Vercel deployments)
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.next();
  }

  // Skip protection for login page and API routes
  if (
    request.nextUrl.pathname === '/demo-login' ||
    request.nextUrl.pathname.startsWith('/api/demo-login')
  ) {
    return NextResponse.next();
  }

  // Check for demo access cookie
  const demoAccess = request.cookies.get('demo-access')?.value;

  if (demoAccess !== 'true') {
    // Redirect to login page
    return NextResponse.redirect(new URL('/demo-login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
