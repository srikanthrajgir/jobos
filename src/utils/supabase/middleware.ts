import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth') || request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup'
  const isAppRoute = request.nextUrl.pathname.startsWith('/app')

  if (!user && isAppRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/app', request.url))
  }

  // Onboarding Protection
  if (user && isAppRoute && !request.nextUrl.pathname.startsWith('/app/onboarding')) {
    // Check onboarding status
    const { data: profile } = await supabase.from('profiles').select('onboarding_status').eq('id', user.id).single();
    // If profile doesn't exist yet, or isn't completed, force them to onboarding
    if (!profile || profile.onboarding_status !== 'completed') {
      return NextResponse.redirect(new URL('/app/onboarding', request.url))
    }
  }

  return supabaseResponse
}
