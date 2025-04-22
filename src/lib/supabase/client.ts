import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/supabase';

// Read-only client using anon key (for client-side operations)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Create read-only client (safe for client-side)
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Create admin client with service role key (ONLY use on server-side or trusted contexts)
// This is the client that has write access to the database
export const getAdminClient = async () => {
  const supabaseServiceKey = import.meta.env.SUPABASE_KEY as string;
  
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_KEY environment variable is not defined');
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    }
  });
};
