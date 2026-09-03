import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // We bypass the strict cookie check here because Supabase stores the 
  // session in localStorage and API routes use the Bearer token header.
  // The client-side components (like AIAssistantUI) will handle redirecting 
  // unauthorized users back to /login.
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
