import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  // Log the visited route
  const timestamp = new Date().toISOString();
  const method = request.method;
  const url = request.nextUrl.pathname;
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  
  // Log to console (will appear in server logs)
  console.log(`[${timestamp}] ${method} ${url} - User-Agent: ${userAgent.substring(0, 50)}...`);
  
  // You could also send this to an external logging service here
  // Example: await fetch('your-logging-endpoint', { method: 'POST', body: JSON.stringify({ timestamp, method, url }) });
  
  return NextResponse.next();
}

// Specify which routes to track
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
