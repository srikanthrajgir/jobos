import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/app'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${requestUrl.origin}${next}`)
      } else if (forwardedHost) {
        // Cloudflare / Coolify Proxy usually sets x-forwarded-host
        const protocol = request.headers.get('x-forwarded-proto') || 'https'
        return NextResponse.redirect(`${protocol}://${forwardedHost}${next}`)
      } else if (process.env.NEXT_PUBLIC_APP_URL) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}${next}`)
      } else {
        return NextResponse.redirect(`${requestUrl.origin}${next}`)
      }
    }
  }

  // Fallback on error
  const forwardedHost = request.headers.get('x-forwarded-host')
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (forwardedHost ? `${protocol}://${forwardedHost}` : requestUrl.origin)
  
  return NextResponse.redirect(`${baseUrl}/login?message=Could not verify email`)
}
