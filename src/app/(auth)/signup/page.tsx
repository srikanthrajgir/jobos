import Link from 'next/link';
import { signup } from '@/app/actions/auth';

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const resolvedParams = await searchParams;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-bg-main px-6 py-12">
      <div className="w-full max-w-md bg-bg-card border border-border-light rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-display tracking-widest uppercase font-bold flex items-center justify-center">
            <span className="text-accent-orange">JOB</span><span className="text-text-heading">OS</span>
          </Link>
          <h1 className="text-2xl font-bold mt-6">Create your account</h1>
          <p className="text-text-muted mt-2">Start turning your job hunt into a system.</p>
        </div>

        <form action={signup} className="space-y-4">
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

          <button 
            type="submit"
            className="w-full bg-primary-teal border-2 border-primary-teal text-bg-main py-3 rounded-xl font-bold hover:bg-primary-teal-dark hover:border-primary-teal-dark transition-all mt-6 shadow-md"
          >
            Get Started
          </button>
        </form>

        <div className="mt-6 text-xs text-text-muted text-center max-w-xs mx-auto leading-relaxed">
          By signing up, you agree to our <Link href="/terms" className="underline hover:text-text-charcoal">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-text-charcoal">Privacy Policy</Link>.
        </div>

        <div className="mt-8 text-center text-sm text-text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-teal hover:text-primary-teal-dark font-bold transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
