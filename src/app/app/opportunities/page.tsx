import { getUserMatches } from '@/app/actions/opportunities';
import OpportunityLayout from '@/components/OpportunityLayout';
import { Target } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';

export default async function OpportunitiesPage() {
  const matches = await getUserMatches();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('career_preferences').select('*').eq('user_id', user?.id).single();

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Page Header */}
      <div className="mb-6 shrink-0">
        <h1 className="text-3xl md:text-4xl font-bold text-text-heading mb-2 flex items-center">
          <Target className="mr-3 text-primary-teal" size={32} />
          Opportunities
        </h1>
        <p className="text-text-muted text-lg mb-4">Up to 10 new opportunities selected for you each day.</p>
        
        <div className="bg-bg-card border border-border-light rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between text-sm">
          <div className="mb-3 md:mb-0">
            <span className="font-bold text-text-heading mr-2">Targeting:</span>
            <span className="text-text-charcoal bg-bg-secondary px-2.5 py-1 rounded-md border border-border-light mr-2">
              {profile?.primary_target_role || 'General Roles'}
            </span>
            <span className="text-text-charcoal bg-bg-secondary px-2.5 py-1 rounded-md border border-border-light">
              Within {profile?.search_radius_km || 25}km of {profile?.preferred_suburb || 'Sydney'}
            </span>
          </div>
          <button className="text-primary-teal font-bold hover:text-primary-teal-dark transition-colors self-start md:self-auto">
            Edit Preferences
          </button>
        </div>
      </div>

      {/* Main Layout (Split View / Tabs handled in Client Component) */}
      <div className="flex-1 min-h-0 bg-bg-card rounded-2xl border border-border-light overflow-hidden shadow-sm">
        <OpportunityLayout initialMatches={matches} />
      </div>
    </div>
  );
}
