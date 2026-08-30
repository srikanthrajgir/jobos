import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-bg-secondary border-t border-border-light pt-16 pb-8">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          <div>
            <h4 className="text-2xl font-display font-bold mb-6 text-text-heading flex items-center">
              <span className="text-accent-orange">JOB</span><span className="text-text-heading">OS</span>
            </h4>
            <p className="not-italic text-text-muted space-y-3 font-medium">
              Discover opportunities, research companies, create stronger applications, manage follow-ups and measure your job-search progress with JobOS.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6 text-text-heading">Product</h4>
            <ul className="space-y-3">
              <li><Link href="/why-jobos" className="text-text-muted hover:text-primary-teal transition-colors">Why JobOS</Link></li>
              <li><Link href="/how-it-works" className="text-text-muted hover:text-primary-teal transition-colors">How It Works</Link></li>
              <li><Link href="/app" className="text-text-muted hover:text-primary-teal transition-colors">Find</Link></li>
              <li><span className="text-text-muted/50 cursor-not-allowed">Advance (Coming Soon)</span></li>
              <li><span className="text-text-muted/50 cursor-not-allowed">Build (Coming Soon)</span></li>
              <li><span className="text-text-muted/50 cursor-not-allowed">Hire (Coming Soon)</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6 text-text-heading">Resources</h4>
            <ul className="space-y-3">
              <li><Link href="/career-intelligence" className="text-text-muted hover:text-primary-teal transition-colors">Career Intelligence</Link></li>
              <li><Link href="/career-intelligence/graduate-careers" className="text-text-muted hover:text-primary-teal transition-colors">Graduate Careers</Link></li>
              <li><Link href="/career-intelligence/career-strategy" className="text-text-muted hover:text-primary-teal transition-colors">Career Strategy</Link></li>
              <li><Link href="/career-intelligence/company-watch" className="text-text-muted hover:text-primary-teal transition-colors">Company Watch</Link></li>
              <li><Link href="/faq" className="text-text-muted hover:text-primary-teal transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6 text-text-heading">Company</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-text-muted hover:text-primary-teal transition-colors">About</Link></li>
              <li><Link href="/contact" className="text-text-muted hover:text-primary-teal transition-colors">Contact</Link></li>
              <li><Link href="/waitlist" className="text-text-muted hover:text-primary-teal transition-colors">Waitlist</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border-light pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-text-muted/60">
          <p>&copy; {new Date().getFullYear()} JobOS. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-primary-teal transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-primary-teal transition-colors">Terms</Link>
            <Link href="/disclaimer" className="hover:text-primary-teal transition-colors">Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
