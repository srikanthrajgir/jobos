import { getActiveJourney } from '@/app/actions/journeys';
import JobJourneySection from '@/components/JobJourneySection';
import { Target, Zap, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import Greeting from '@/components/Greeting';

export default async function AppDashboard() {
  const activeJourney = await getActiveJourney();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch real user data for momentum, tasks, pipeline
  const [{ data: profile }, { count: applicationsCount }, { data: tasks }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user?.id).single(),
    supabase.from('job_applications').select('*', { count: 'exact', head: true }).eq('user_id', user?.id),
    supabase.from('user_tasks').select('*').eq('user_id', user?.id).order('due_date', { ascending: true }).limit(3)
  ]);

  const showJourneyCtaBelow = profile?.journey_decision === 'no' && !activeJourney;

  return (
    <div className="space-y-8 pb-12">
      {/* Dynamic Greeting */}
      <Greeting firstName={profile?.first_name} />

      {/* Conditional Job Journey (Top) */}
      {!showJourneyCtaBelow && <JobJourneySection initialJourney={activeJourney} />}

      {/* Existing Cards Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Momentum / Consistency */}
        <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-text-muted uppercase tracking-wider text-sm flex items-center">
              <Zap size={16} className="mr-2 text-accent-orange" /> Momentum
            </h3>
            <span className="bg-accent-orange/10 text-accent-orange text-[11px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md">Building</span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-bg-secondary">
              <div className="absolute inset-0 rounded-full border-8 border-primary-teal border-t-transparent -rotate-45"></div>
              <div className="text-center">
                <span className="block text-3xl font-black text-text-heading">1</span>
                <span className="text-xs font-medium text-text-muted uppercase">Action</span>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-text-charcoal font-medium mt-6">
            You completed 1 career action this week.
          </p>
        </div>

        {/* Pipeline Snapshot */}
        <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-text-muted uppercase tracking-wider text-sm flex items-center">
              <Target size={16} className="mr-2 text-primary-teal" /> Pipeline
            </h3>
            <button className="text-xs font-bold text-primary-teal hover:text-primary-teal-dark transition-colors">View Board</button>
          </div>
          
          {applicationsCount === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <Target size={32} className="text-border-light mb-3" />
              <p className="text-text-heading font-bold mb-1">Your pipeline is ready</p>
              <p className="text-xs text-text-muted">Save an opportunity or record an application to begin tracking your progress.</p>
            </div>
          ) : (
            <div className="flex-1 space-y-4">
              {[
                { label: 'Saved Opportunities', count: applicationsCount, color: 'bg-text-muted' },
                { label: 'Applications Sent', count: 0, color: 'bg-primary-teal' },
                { label: 'Interviewing', count: 0, color: 'bg-accent-orange' },
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
          )}
        </div>

        {/* Action Plan / Follow-ups */}
        <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-text-muted uppercase tracking-wider text-sm flex items-center">
              <Clock size={16} className="mr-2 text-text-charcoal" /> Action Plan
            </h3>
          </div>
          
          {!tasks || tasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <CheckCircle2 size={32} className="text-border-light mb-3" />
              <p className="text-text-heading font-bold mb-1">You're all caught up!</p>
              <p className="text-xs text-text-muted">No pending tasks. Check out Job Intelligence for next steps.</p>
            </div>
          ) : (
            <div className="flex-1 space-y-3">
              {tasks.map((task: any) => (
                <div key={task.id} className={`flex items-start p-3 rounded-xl border ${task.status === 'done' ? 'border-border-light bg-bg-secondary opacity-60' : 'border-border-light bg-bg-main hover:border-primary-teal transition-colors'}`}>
                  {task.status === 'done' ? (
                    <CheckCircle2 size={18} className="text-text-muted mt-0.5 mr-3 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded border-2 border-border-hover mt-0.5 mr-3 shrink-0 cursor-pointer hover:border-primary-teal"></div>
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-text-muted' : 'text-text-charcoal'}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-text-muted mt-1">{task.due_date ? 'Today' : 'Pending'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <button className="w-full mt-4 py-2 border border-border-light text-sm font-bold text-text-charcoal rounded-xl hover:bg-bg-hover transition-colors">
            View All Tasks
          </button>
        </div>
      </div>

      {/* Conditional Job Journey (Bottom) */}
      {showJourneyCtaBelow && (
        <div className="mt-8 border-t border-border-light pt-8">
          <JobJourneySection initialJourney={activeJourney} />
        </div>
      )}
    </div>
  );
}
