import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('menudeo_inventario').select('id', { count: 'exact', head: true });
    if (error) return NextResponse.json({ status: 'error', database: 'unavailable', reason: 'Query failed' }, { status: 503 });
    return NextResponse.json({ status: 'ok', database: 'connected', project: 'Carola Menudeo' });
  } catch {
    return NextResponse.json({ status: 'error', database: 'unconfigured' }, { status: 503 });
  }
}
