import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAIProvider } from '@/utils/ai/provider';

// This endpoint would normally be called by a Coolify cron job.
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'dev_secret'}`) {
      // Allow in dev for easy triggering if no secret is set
      if (process.env.NODE_ENV === 'production') {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    // Bypass RLS for background job
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. Create a dummy opportunity if none exist
    const { data: opps } = await supabaseAdmin.from('job_opportunities').select('id').limit(1);
    
    let oppId = opps?.[0]?.id;
    if (!oppId) {
      const { data: newOpp } = await supabaseAdmin.from('job_opportunities').insert([{
        title: 'Project Coordinator',
        department: 'Operations',
        industry: 'Construction',
        description_excerpt: 'Join our team as a Project Coordinator to oversee site operations...',
        employment_type: 'Full-time',
        suburb: 'Sydney',
        state: 'NSW',
        application_mode: 'email',
        application_email: 'careers@example.com',
        status: 'active'
      }]).select().single();
      oppId = newOpp.id;
    }

    // 2. Fetch all users
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    
    // 3. Assign opportunity
    if (users && users.users) {
      const provider = getAIProvider();
      for (const u of users.users) {
        // Check if assigned today
        const { count } = await supabaseAdmin.from('user_opportunity_matches')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', u.id)
          .eq('batch_date', new Date().toISOString().split('T')[0]);
          
        if (count === 0) {
          const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', u.id).single();
          const { data: fullOpp } = await supabaseAdmin.from('job_opportunities').select('*').eq('id', oppId).single();
          
          const ranked = await provider.rankOpportunities(profile, [fullOpp]);
          
          await supabaseAdmin.from('user_opportunity_matches').insert([{
            user_id: u.id,
            opportunity_id: oppId,
            batch_date: new Date().toISOString().split('T')[0],
            rank: 1,
            match_score: ranked[0].match_score,
            match_category: ranked[0].match_category,
            match_reasons: ranked[0].match_reasons,
            potential_gaps: ranked[0].potential_gaps,
            recommended_approach: ranked[0].recommended_approach,
            status: 'new'
          }]);
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Matching run completed' });
  } catch (err: any) {
    console.error('Matching Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
