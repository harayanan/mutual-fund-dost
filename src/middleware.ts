import { NextRequest, NextResponse } from 'next/server'

const USERNAME = process.env.SITE_USERNAME ?? 'mf'
const PASSWORD = process.env.SITE_PASSWORD ?? 'mf2026'

export function middleware(request: NextRequest) {
  // Skip auth for cron API routes (called by Vercel with CRON_SECRET)
  if (request.nextUrl.pathname.startsWith('/api/cron')) {
    return NextResponse.next()
  }

  const authHeader = request.headers.get('authorization')

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(' ')
    if (scheme === 'Basic' && encoded) {
      const decoded = Buffer.from(encoded, 'base64').toString('utf-8')
      const [user, pass] = decoded.split(':')
      if (user === USERNAME && pass === PASSWORD) {
        return NextResponse.next()
      }
    }
  }

  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="HDFC MFD Hub", charset="UTF-8"',
    },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
