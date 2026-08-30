"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative pt-12 md:pt-20 lg:pt-24 pb-20 overflow-hidden bg-bg-main border-b border-border-light transition-colors duration-300 min-h-[90vh] flex items-center">
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="overflow-hidden flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8 }}
              className="text-primary-teal font-bold uppercase tracking-widest text-sm mb-4"
            >
              Your career, running on a better system.
            </motion.div>
            
            <motion.h1 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold font-sans text-text-heading leading-tight mb-6"
            >
              Turn job hunting into a <span className="text-accent-orange">system</span> that gets results.
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-lg md:text-xl font-medium text-text-muted mb-10 leading-relaxed"
            >
              JobOS uses AI to help you discover opportunities, research companies, prepare stronger applications, follow up consistently and measure real progress - without losing control of your career.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link 
                href="/signup" 
                className="bg-accent-orange border-2 border-accent-orange text-white px-8 py-4 rounded-xl font-bold hover:bg-[#ea580c] hover:border-[#ea580c] hover:shadow-lg transition-all duration-200 inline-block text-center text-base"
              >
                Build My JobOS
              </Link>
              <Link 
                href="/how-it-works" 
                className="bg-bg-secondary border-2 border-border-light text-text-heading px-8 py-4 rounded-xl font-bold hover:bg-border-light transition-all duration-200 inline-block text-center text-base"
              >
                See How It Works
              </Link>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="w-full flex justify-center items-center mt-12 lg:mt-0"
          >
            <div className="w-full aspect-video bg-bg-card rounded-2xl border border-border-light shadow-2xl p-4 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-12 bg-bg-secondary border-b border-border-light flex items-center px-4 space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="mt-12 h-full flex items-center justify-center text-text-muted font-medium bg-bg-hover/50 rounded-lg border border-dashed border-border-light">
                 Dashboard Preview (React Interactive)
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
