import Link from 'next/link';
import { FileText, LayoutDashboard, Settings, Users, Briefcase } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-bg-secondary overflow-hidden font-sans">
      <aside className="w-[260px] flex flex-col bg-bg-card border-r border-border-light z-20">
        <div className="h-16 flex items-center px-6 border-b border-border-light shrink-0">
          <Link href="/admin" className="text-2xl font-display font-bold flex items-center">
            <span className="text-accent-orange">JOB</span><span className="text-text-heading">OS</span>
            <span className="ml-3 px-1.5 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-bold rounded uppercase tracking-wider">Admin</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            <Link href="/admin" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-text-charcoal hover:bg-bg-hover transition-colors">
              <LayoutDashboard size={20} className="text-text-muted" />
              <span className="text-sm tracking-wide font-medium">Overview</span>
            </Link>
            <Link href="/admin/content" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-text-charcoal hover:bg-bg-hover transition-colors">
              <FileText size={20} className="text-text-muted" />
              <span className="text-sm tracking-wide font-medium">Career Intelligence</span>
            </Link>
            <Link href="/admin/companies" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-text-charcoal hover:bg-bg-hover transition-colors">
              <Briefcase size={20} className="text-text-muted" />
              <span className="text-sm tracking-wide font-medium">Companies & Jobs</span>
            </Link>
            <Link href="/admin/users" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-text-charcoal hover:bg-bg-hover transition-colors">
              <Users size={20} className="text-text-muted" />
              <span className="text-sm tracking-wide font-medium">Users</span>
            </Link>
            <Link href="/admin/ai" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-text-charcoal hover:bg-bg-hover transition-colors">
              <Settings size={20} className="text-text-muted" />
              <span className="text-sm tracking-wide font-medium">AI & Settings</span>
            </Link>
          </nav>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0 bg-bg-main relative">
        <main className="flex-1 overflow-y-auto p-8 scroll-smooth">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
