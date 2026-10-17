import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
/** Uses the existing Supabase project; never embeds privileged keys. */
export function getSupabaseClient() {
  if (!url || !key) throw new Error('Falta configurar las variables públicas de Supabase');
  return createClient(url, key);
}
