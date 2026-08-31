import { getActiveJourney } from '@/app/actions/journeys';
import JobJourneySection from '@/components/JobJourneySection';
import { Target, Zap, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';

export default async function AppDashboard() {
  const activeJourney = await getActiveJourney();

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-text-heading mb-2">Good morning.</h1>
        <p className="text-text-muted text-lg">Let's keep the momentum going.</p>
      </div>

      {/* Career Journey (Job Journey) Section */}
      <JobJourneySection initialJourney={activeJourney} />

      {/* Existing Cards Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Momentum / Consistency */}
        <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-text-muted uppercase tracking-wider text-sm flex items-center">
              <Zap size={16} className="mr-2 text-accent-orange" /> Momentum
            </h3>
            <span className="bg-accent-orange/10 text-accent-orange text-xs font-bold px-2.5 py-1 rounded-md">3 Day Streak</span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-bg-secondary">
              <div className="absolute inset-0 rounded-full border-8 border-primary-teal border-t-transparent -rotate-45"></div>
              <div className="text-center">
                <span className="block text-3xl font-black text-text-heading">12</span>
                <span className="text-xs font-medium text-text-muted uppercase">Actions</span>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-text-charcoal font-medium mt-6">
            You're in the top 15% of active users this week.
          </p>
        </div>

        {/* Pipeline Snapshot */}
        <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-text-muted uppercase tracking-wider text-sm flex items-center">
              <Target size={16} className="mr-2 text-primary-teal" /> Pipeline
            </h3>
            <button className="text-xs font-bold text-primary-teal hover:text-primary-teal-dark">View Board</button>
          </div>
          <div className="flex-1 space-y-4">
            {[
              { label: 'Saved Opportunities', count: 14, color: 'bg-text-muted' },
              { label: 'Applications Sent', count: 5, color: 'bg-primary-teal' },
              { label: 'Interviewing', count: 2, color: 'bg-accent-orange' },
              { label: 'Offers', count: 0, color: 'bg-green-500' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center justify-between group cursor-pointer p-2 -mx-2 rounded-lg hover:bg-bg-hover transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
                  <span className="text-sm font-medium text-text-charcoal">{stat.label}</span>
                </div>
                <span className="font-bold text-text-heading">{stat.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Plan / Follow-ups */}
        <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-text-muted uppercase tracking-wider text-sm flex items-center">
              <Clock size={16} className="mr-2 text-text-charcoal" /> Action Plan
            </h3>
          </div>
          <div className="flex-1 space-y-3">
            {[
              { text: 'Follow up with Multiplex HR', due: 'Today', status: 'pending' },
              { text: 'Review updated ATS Resume', due: 'Tomorrow', status: 'pending' },
              { text: 'Complete Fit-Gap for Project Engineer', due: 'Completed', status: 'done' },
            ].map((task, i) => (
              <div key={i} className={`flex items-start p-3 rounded-xl border ${task.status === 'done' ? 'border-border-light bg-bg-secondary opacity-60' : 'border-border-light bg-bg-main hover:border-primary-teal'}`}>
                {task.status === 'done' ? (
                  <CheckCircle2 size={18} className="text-text-muted mt-0.5 mr-3 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded border-2 border-border-hover mt-0.5 mr-3 shrink-0 cursor-pointer"></div>
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-text-muted' : 'text-text-charcoal'}`}>
                    {task.text}
                  </p>
                  <p className="text-xs text-text-muted mt-1">{task.due}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 border border-border-light text-sm font-bold text-text-charcoal rounded-xl hover:bg-bg-hover transition-colors">
            View All Tasks
          </button>
        </div>

      </div>
    </div>
  );
}
