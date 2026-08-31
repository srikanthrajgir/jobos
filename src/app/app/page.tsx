import { getActiveJourney } from '@/app/actions/journeys';
import JobJourneySection from '@/components/JobJourneySection';
import { Target, Zap, Clock, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import Greeting from '@/components/Greeting';
import Link from 'next/link';
import { requireUserPage } from '@/lib/auth';
import { completeTask } from '@/app/actions/tasks';
import { isoDaysAgo } from '@/lib/time';

export default async function AppDashboard() {
  const activeJourney = await getActiveJourney();
  const user = await requireUserPage();
  const supabase = await createClient();

  // Fetch real user data for momentum, tasks, pipeline
  const weekAgo = isoDaysAgo(7);
  const [{ data: profile }, { data: applications }, { data: tasks }, { count: completedActions }] = await Promise.all([
    supabase.from('profiles').select('first_name, journey_decision').eq('id', user.id).single(),
    supabase.from('job_applications').select('status').eq('user_id', user.id),
    supabase.from('user_tasks').select('id, title, status, due_date').eq('user_id', user.id).order('due_date', { ascending: true }).limit(5),
    supabase.from('user_tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'done').gte('completed_at', weekAgo)
  ]);

  const applicationsCount = applications?.length || 0;
  const pipelineStats = [
    { label: 'Saved Opportunities', count: applications?.filter((item) => ['saved', 'draft'].includes(item.status)).length || 0, color: 'bg-text-muted' },
    { label: 'Applications Sent', count: applications?.filter((item) => item.status === 'applied').length || 0, color: 'bg-primary-teal' },
    { label: 'Interviewing', count: applications?.filter((item) => item.status === 'interview').length || 0, color: 'bg-accent-orange' },
    { label: 'Offers', count: applications?.filter((item) => ['offer', 'accepted'].includes(item.status)).length || 0, color: 'bg-green-500' },
  ];

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
                <span className="block text-3xl font-black text-text-heading">{completedActions || 0}</span>
                <span className="text-xs font-medium text-text-muted uppercase">Actions</span>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-text-charcoal font-medium mt-6">
            You completed {completedActions || 0} career actions this week.
          </p>
        </div>

        {/* Pipeline Snapshot */}
        <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-text-muted uppercase tracking-wider text-sm flex items-center">
              <Target size={16} className="mr-2 text-primary-teal" /> Pipeline
            </h3>
            <Link href="/app/pipeline" className="text-xs font-bold text-primary-teal hover:text-primary-teal-dark transition-colors">View Board</Link>
          </div>
          
          {applicationsCount === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <Target size={32} className="text-border-light mb-3" />
              <p className="text-text-heading font-bold mb-1">Your pipeline is ready</p>
              <p className="text-xs text-text-muted">Save an opportunity or record an application to begin tracking your progress.</p>
            </div>
          ) : (
            <div className="flex-1 space-y-4">
              {pipelineStats.map((stat) => (
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
              <p className="text-text-heading font-bold mb-1">You’re all caught up!</p>
              <p className="text-xs text-text-muted">No pending tasks. Check out Job Intelligence for next steps.</p>
            </div>
          ) : (
            <div className="flex-1 space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className={`flex items-start p-3 rounded-xl border ${task.status === 'done' ? 'border-border-light bg-bg-secondary opacity-60' : 'border-border-light bg-bg-main hover:border-primary-teal transition-colors'}`}>
                  {task.status === 'done' ? (
                    <CheckCircle2 size={18} className="text-text-muted mt-0.5 mr-3 shrink-0" />
                  ) : (
                    <form action={completeTask.bind(null, task.id)} className="mr-3 mt-0.5 shrink-0">
                      <button aria-label={`Complete ${task.title}`} className="block h-4 w-4 rounded border-2 border-border-hover hover:border-primary-teal"></button>
                    </form>
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
