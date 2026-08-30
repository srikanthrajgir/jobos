export default function AppDashboard() {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-display font-bold text-text-heading">Good morning, Srika.</h2>
        <p className="text-text-muted mt-2">Targeting: Senior Software Engineer roles in Sydney.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Momentum Score */}
        <div className="bg-bg-card p-6 rounded-2xl border border-border-light shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Consistency</h3>
            <div className="mt-4 text-4xl font-black text-text-heading">4<span className="text-xl text-text-muted"> / 5 days</span></div>
          </div>
          <div className="mt-4 flex gap-1">
            <div className="flex-1 h-2 bg-primary-teal rounded-full"></div>
            <div className="flex-1 h-2 bg-primary-teal rounded-full"></div>
            <div className="flex-1 h-2 bg-primary-teal rounded-full"></div>
            <div className="flex-1 h-2 bg-primary-teal rounded-full"></div>
            <div className="flex-1 h-2 bg-bg-hover rounded-full"></div>
          </div>
        </div>

        {/* Applications */}
        <div className="bg-bg-card p-6 rounded-2xl border border-border-light shadow-sm">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">Pipeline</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-charcoal font-medium">Reviewing</span>
              <span className="bg-bg-hover px-2 py-0.5 rounded-md font-bold text-text-heading">12</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-charcoal font-medium">Applied</span>
              <span className="bg-primary-teal-light text-primary-teal-dark px-2 py-0.5 rounded-md font-bold">4</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-charcoal font-medium">Interviewing</span>
              <span className="bg-accent-orange-light text-accent-orange px-2 py-0.5 rounded-md font-bold">1</span>
            </div>
          </div>
        </div>

        {/* Follow Ups */}
        <div className="bg-bg-card p-6 rounded-2xl border border-border-light shadow-sm">
           <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">Action Plan</h3>
           <div className="flex items-center gap-3 mb-3 p-3 bg-accent-orange-light/50 rounded-xl border border-accent-orange-light">
             <div className="w-2 h-2 rounded-full bg-accent-orange"></div>
             <div className="flex-1">
               <div className="text-sm font-bold text-text-heading">Follow up with Canva</div>
               <div className="text-xs text-text-muted mt-0.5">Applied 7 days ago</div>
             </div>
           </div>
           <button className="w-full py-2 text-sm font-bold text-primary-teal hover:bg-primary-teal-light rounded-lg transition-colors">
             View all tasks
           </button>
        </div>
      </div>
    </div>
  );
}
