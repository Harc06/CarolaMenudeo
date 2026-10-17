import { createClient } from '@supabase/supabase-js';

/** Dedicated Supabase project for Carola Menudeo. Never connect to wholesale/admin. */
const MENUDEO_PROJECT_REF = 'hnivrzcjxjofgzgopmbv';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function getSupabaseClient() {
  if (!url || !key) throw new Error('Faltan variables de entorno de Supabase Menudeo');
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.hostname !== `${MENUDEO_PROJECT_REF}.supabase.co`) {
    throw new Error('Conexión bloqueada: este sistema solo permite Supabase Carola Menudeo');
  }
  return createClient(url, key);
}
