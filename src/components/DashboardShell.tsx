"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Search, Building2, KanbanSquare, 
  FileEdit, FileText, LogOut, ChevronLeft, ChevronRight,
  Menu, X, Bell
} from 'lucide-react';
import { signOut } from '@/app/actions/auth';

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: 'Today', href: '/app' },
  { icon: Search, label: 'Opportunities', href: '/app/opportunities' },
  { icon: Building2, label: 'Companies', href: '/app/companies' },
  { icon: KanbanSquare, label: 'Pipeline', href: '/app/pipeline' },
  { icon: FileEdit, label: 'Application Studio', href: '/app/application-studio' },
  { icon: FileText, label: 'Resume', href: '/app/resume' },
];

export default function DashboardShell({ children, userEmail }: { children: React.ReactNode, userEmail?: string }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex h-screen bg-bg-secondary overflow-hidden font-sans">
      
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex flex-col bg-bg-card border-r border-border-light transition-all duration-300 z-20 ${
          isCollapsed ? 'w-[80px]' : 'w-[260px]'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-border-light shrink-0">
          {!isCollapsed && (
            <Link href="/app" className="text-2xl font-display font-bold flex items-center">
              <span className="text-accent-orange">JOB</span><span className="text-text-heading">OS</span>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/app" className="mx-auto text-xl font-display font-bold flex items-center">
              <span className="text-accent-orange">J</span><span className="text-text-heading">O</span>
            </Link>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md text-text-muted hover:bg-bg-hover hidden md:block"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 scroll-smooth">
          <nav className="space-y-1 px-3">
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ${
                    isActive 
                      ? 'bg-primary-teal-light text-primary-teal-dark font-bold' 
                      : 'text-text-charcoal hover:bg-bg-hover hover:text-text-heading'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <item.icon size={20} className={isActive ? 'text-primary-teal-dark' : 'text-text-muted'} />
                  {!isCollapsed && <span className="text-sm tracking-wide">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-border-light">
          <button 
            onClick={handleSignOut}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-text-muted hover:bg-bg-hover hover:text-red-500 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="text-sm tracking-wide font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-bg-main/80 backdrop-blur-sm z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="md:hidden fixed inset-y-0 left-0 w-[260px] bg-bg-card border-r border-border-light z-50 flex flex-col shadow-2xl"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-border-light">
                <Link href="/app" className="text-2xl font-display font-bold flex items-center">
                  <span className="text-accent-orange">JOB</span><span className="text-text-heading">OS</span>
                </Link>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-text-muted">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-4">
                  {SIDEBAR_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-4 px-4 py-3 rounded-xl transition-colors ${
                          isActive 
                            ? 'bg-primary-teal-light text-primary-teal-dark font-bold' 
                            : 'text-text-charcoal hover:bg-bg-hover'
                        }`}
                      >
                        <item.icon size={20} className={isActive ? 'text-primary-teal-dark' : 'text-text-muted'} />
                        <span className="text-sm tracking-wide">{item.label}</span>
                      </Link>
                    );
                  })}
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-text-muted hover:bg-bg-hover hover:text-red-500 transition-colors mt-4 border-t border-border-light"
                  >
                    <LogOut size={20} />
                    <span className="text-sm tracking-wide font-medium">Sign Out</span>
                  </button>
                </nav>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-bg-main relative">
        
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-border-light bg-bg-card/50 backdrop-blur-md shrink-0">
          <div className="flex items-center">
            <button 
              className="md:hidden p-2 -ml-2 mr-2 text-text-charcoal"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-bold text-text-heading capitalize">
              {pathname === '/app' ? 'Today' : pathname.split('/').pop()?.replace('-', ' ')}
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            {userEmail && (
              <span className="hidden md:inline-block text-sm font-medium text-text-muted">
                {userEmail}
              </span>
            )}
            <button className="p-2 text-text-muted hover:text-text-charcoal rounded-full hover:bg-bg-hover transition-colors">
              <Search size={20} />
            </button>
            <button className="relative p-2 text-text-muted hover:text-text-charcoal rounded-full hover:bg-bg-hover transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-orange rounded-full border border-bg-card"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary-teal text-bg-main flex items-center justify-center font-bold text-sm shadow-sm ml-2 cursor-pointer">
              JS
            </div>
          </div>
        </header>

        {/* Scrollable Workspace */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth flex flex-col">
          <div className="max-w-7xl mx-auto w-full flex-1">
            {children}
          </div>
          
          <footer className="max-w-7xl mx-auto w-full mt-12 py-6 border-t border-border-light text-center text-xs text-text-muted flex justify-center space-x-4">
            <span>© {new Date().getFullYear()} JobOS</span>
            <span>&middot;</span>
            <Link href="/privacy" className="hover:text-primary-teal transition-colors">Privacy</Link>
            <span>&middot;</span>
            <Link href="/terms" className="hover:text-primary-teal transition-colors">Terms</Link>
            <span>&middot;</span>
            <Link href="/disclaimer" className="hover:text-primary-teal transition-colors">Disclaimer</Link>
            <span>&middot;</span>
            <Link href="/help" className="hover:text-primary-teal transition-colors">Help</Link>
          </footer>
        </main>
        
      </div>
    </div>
  );
}
