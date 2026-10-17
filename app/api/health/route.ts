import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    getSupabaseClient();
    // Inventory is private: anonymous health checks must not read protected tables.
    return NextResponse.json({ status: 'ok', configuration: 'valid', project: 'Carola Menudeo', database: 'requires_authentication' });
  } catch {
    return NextResponse.json({ status: 'error', configuration: 'invalid' }, { status: 503 });
  }
}
