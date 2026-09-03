"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-bg-main backdrop-blur-md py-4 shadow-md border-b border-border-light' : 'bg-transparent py-6'
      }`}
    >
      <div className="w-full px-6 md:px-12 flex justify-between items-center">
        <Link href="/" className="text-5xl font-display tracking-widest uppercase font-bold flex items-center">
          <span className="text-accent-orange">JOB</span><span className="text-text-heading">OS</span>
        </Link>
        
        <div className="flex items-center space-x-4 md:space-x-6">
          <nav className="hidden lg:flex items-center space-x-6 text-sm tracking-widest uppercase font-medium">
            <Link href="/why-jobos" className="text-text-muted hover:text-text-charcoal transition-colors">Why JobOS</Link>
            <Link href="/how-it-works" className="text-text-muted hover:text-text-charcoal transition-colors">How It Works</Link>
            <Link href="/job-intelligence" className="text-text-muted hover:text-text-charcoal transition-colors">Job Intelligence</Link>
            <Link href="/faq" className="text-text-muted hover:text-text-charcoal transition-colors">FAQ</Link>
            <Link href="/login" className="text-text-muted hover:text-text-charcoal transition-colors">Sign In</Link>
            <Link href="/signup" className="px-4 py-2 bg-primary-teal text-white rounded-md font-bold hover:bg-primary-teal-dark transition-colors">Build My JobOS</Link>
          </nav>
          
          <ThemeToggle className="flex items-center justify-center p-2 border border-border-light rounded-full bg-bg-secondary text-text-charcoal hover:border-primary-teal hover:shadow-sm transition-all" />

          <button 
            className="lg:hidden text-text-charcoal focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden absolute top-full left-0 w-full bg-bg-main border-b border-border-light py-6 px-6 flex flex-col space-y-4 shadow-xl"
        >
          <Link href="/why-jobos" className="text-text-muted hover:text-text-charcoal uppercase tracking-widest text-sm py-2">Why JobOS</Link>
          <Link href="/how-it-works" className="text-text-muted hover:text-text-charcoal uppercase tracking-widest text-sm py-2">How It Works</Link>
          <Link href="/job-intelligence" className="text-text-muted hover:text-text-charcoal uppercase tracking-widest text-sm py-2">Job Intelligence</Link>
          <Link href="/faq" className="text-text-muted hover:text-text-charcoal uppercase tracking-widest text-sm py-2">FAQ</Link>
          <Link href="/login" className="text-text-muted hover:text-text-charcoal uppercase tracking-widest text-sm py-2">Sign In</Link>
          <Link href="/signup" className="text-primary-teal hover:text-primary-teal-dark uppercase tracking-widest text-sm py-2 font-bold">Build My JobOS</Link>
        </motion.div>
      )}
    </header>
  );
};

export default Navbar;
