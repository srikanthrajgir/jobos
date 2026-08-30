import Link from 'next/link';
import { login } from '@/app/actions/auth';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-bg-main px-6">
      <div className="w-full max-w-md bg-bg-card border border-border-light rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-display tracking-widest uppercase font-bold flex items-center justify-center">
            <span className="text-accent-orange">JOB</span><span className="text-text-heading">OS</span>
          </Link>
          <h1 className="text-2xl font-bold mt-6">Welcome back</h1>
          <p className="text-text-muted mt-2">Sign in to continue your career journey.</p>
        </div>

        <form action={login} className="space-y-4">
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
