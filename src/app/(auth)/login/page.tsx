import Link from 'next/link';
import { login, signInWithGoogle } from '@/app/actions/auth';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const resolvedParams = await searchParams;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-bg-main px-6 py-12">
      <div className="w-full max-w-md bg-bg-card border border-border-light rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-display tracking-widest uppercase font-bold flex items-center justify-center">
            <span className="text-accent-orange">JOB</span><span className="text-text-heading">OS</span>
          </Link>
          <h1 className="text-2xl font-bold mt-6">Welcome back</h1>
          <p className="text-text-muted mt-2">Sign in to continue your job search journey.</p>
        </div>

        <form action={signInWithGoogle} className="mb-6">
          <button type="submit" className="w-full bg-white border border-border-light text-black py-3 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-light"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-bg-card text-text-muted font-medium">Or sign in with email</span>
          </div>
        </div>

        <form action={login} className="space-y-4">
          {resolvedParams?.message && (
            <div className="p-3 bg-red-500/10 border border-red-500 rounded-xl text-red-500 text-sm font-bold text-center">
              {resolvedParams.message}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-text-charcoal mb-1">Email</label>
            <input 
              type="email" 
              name="email"
              required 
              className="w-full bg-bg-input border border-border-light rounded-xl py-3 px-4 focus:outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange transition-all"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-charcoal mb-1">Password</label>
            <input 
              type="password" 
              name="password"
              required 
              className="w-full bg-bg-input border border-border-light rounded-xl py-3 px-4 focus:outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange transition-all"
              placeholder="••••••••"
            />
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <Link href="/forgot-password" className="text-sm text-primary-teal hover:text-primary-teal-dark transition-colors font-bold">
              Forgot password?
            </Link>
          </div>

          <button 
            type="submit"
            className="w-full bg-accent-orange border-2 border-accent-orange text-white py-3 rounded-xl font-bold hover:bg-[#ea580c] hover:border-[#ea580c] transition-all mt-6 shadow-md"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-text-muted">
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary-teal hover:text-primary-teal-dark font-bold transition-colors">
            Build My JobOS
          </Link>
        </div>
      </div>
    </div>
  );
}
