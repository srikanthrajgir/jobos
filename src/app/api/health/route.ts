import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Simple query to verify DB connection safely without leaking rows
    const { error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error) {
      console.error("Health check DB error:", error);
      return NextResponse.json({ status: 'degraded', database: 'disconnected' }, { status: 500 });
    }

    return NextResponse.json({ status: 'healthy', database: 'connected' }, { status: 200 });
  } catch {
    return NextResponse.json({ status: 'degraded', database: 'disconnected' }, { status: 500 });
  }
}
